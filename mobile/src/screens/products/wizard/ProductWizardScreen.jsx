import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Image, Alert,
  ActivityIndicator, Switch, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import {
  createProduct, updateProduct, publishProduct,
  addProductImage, bulkUpdateVariants, uploadImage,
  generateContent, generateProductImage,
} from '../../../lib/api';
import { MOCK_CATEGORIES, GOLD_PURITIES, GOLD_COLORS, STONE_TYPES } from '../../../constants/categories';
import { COLORS, PRODUCT_SIZES, PRODUCT_TYPES } from '../../../constants';
import { formatPrice, discountedPrice } from '../../../lib/utils';

const WARM_BG = '#fffaf5';
const CARD_BG = '#ffffff';
const SECTION_BORDER = '#fde8d0';
const ACCENT = '#b91c1c';
const AMBER_500 = '#f59e0b';

const PHOTO_BLOCKS = {
  saree: ['Full Saree', 'Pallu', 'Border', 'Blouse Piece', 'Fabric Closeup', 'Draping Style', 'Zari Work', 'Tag/Label'],
  dress: ['Complete Outfit', 'Top/Kurta', 'Bottom/Pants', 'Dupatta/Chunni', 'Embroidery Detail', 'Fabric Closeup', 'Back View', 'Tag/Label'],
  jewellery: ['Full Piece', 'Front Detail', 'Back/Clasp', 'Stone Setting', 'Weight Tag', 'Hallmark', 'Packaging', 'Scale Reference'],
};

const COLOR_MAP = {
  Red: '#ef4444', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308',
  Purple: '#a855f7', Pink: '#ec4899', Orange: '#f97316', Black: '#1f2937',
  White: '#f9fafb', Navy: '#1e3a5f', Maroon: '#7f1d1d', Teal: '#14b8a6',
  Gold: '#d4a017', Silver: '#9ca3af', Brown: '#92400e', Cream: '#fef3c7', Ivory: '#fffff0',
};

function SectionCard({ icon, iconColor, title, subtitle, children }) {
  return (
    <View className="mx-4 mb-5 rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: SECTION_BORDER }}>
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: iconColor + '18' }}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: '#78350f' }}>{title}</Text>
          {subtitle && <Text className="text-xs mt-0.5" style={{ color: '#a16207' }}>{subtitle}</Text>}
        </View>
      </View>
      <View className="px-4 pb-4 pt-2">{children}</View>
    </View>
  );
}

function Chip({ label, selected, onPress, colorDot }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-3 py-2 rounded-full border mr-2 mb-2"
      style={{
        backgroundColor: selected ? '#fef3c7' : '#ffffff',
        borderColor: selected ? '#f59e0b' : '#e5e7eb',
      }}
    >
      {colorDot && (
        <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colorDot, borderWidth: 1, borderColor: '#e5e7eb' }} />
      )}
      <Text className="text-xs font-semibold" style={{ color: selected ? '#92400e' : '#6b7280' }}>
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={14} color="#d97706" style={{ marginLeft: 4 }} />}
    </Pressable>
  );
}

function Divider() {
  return (
    <View className="flex-row items-center my-3 mx-4">
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
      <Text className="mx-3" style={{ color: '#d4a017', fontSize: 8 }}>✦</Text>
      <View className="flex-1 h-px" style={{ backgroundColor: '#f9d7b0' }} />
    </View>
  );
}

export default function ProductWizardScreen({ route, navigation }) {
  const { mode = 'create', type = 'saree', productId } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [wizardData, setWizardData] = useState({
    type,
    categoryId: '',
    categoryName: '',
    images: [],
    variants: [],
    extras: {},
    content: { title: '', description: '' },
    pricing: { basePrice: 0, discountPct: 0, couponCode: '', couponDiscount: 0, tags: '' },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [hasCoupon, setHasCoupon] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Variant state
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [goldPurity, setGoldPurity] = useState('22K');
  const [goldColor, setGoldColor] = useState('Gold');
  const [stoneType, setStoneType] = useState('None');
  const [selectedWeights, setSelectedWeights] = useState([]);

  const update = useCallback((partial) => setWizardData((prev) => ({ ...prev, ...partial })), []);

  const photoBlocks = PHOTO_BLOCKS[wizardData.type] || PHOTO_BLOCKS.saree;
  const allCategories = [...(MOCK_CATEGORIES[wizardData.type] || []), ...customCategories];

  // ─── Photo Picker ──────────────────────────────────────────────────────────

  const pickImage = async (label, source) => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos. Please enable it in Settings.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed. Please enable it in Settings.');
          return;
        }
      }

      const options = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploading(label);

      const { url } = await uploadImage(uri);
      const isPrimary = wizardData.images.length === 0;
      const newImages = [
        ...wizardData.images.filter((img) => img.label !== label),
        { label, uri, uploadedUrl: url, isPrimary },
      ];
      update({ images: newImages });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to pick image. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const showPhotoPicker = (label) => {
    const existing = wizardData.images.find((img) => img.label === label);
    const buttons = [
      { text: 'Take Photo', onPress: () => pickImage(label, 'camera') },
      { text: 'Choose from Gallery', onPress: () => pickImage(label, 'gallery') },
    ];
    if (existing) {
      buttons.push({
        text: 'Remove Photo', style: 'destructive',
        onPress: () => {
          const newImages = wizardData.images.filter((img) => img.label !== label);
          if (newImages.length > 0 && !newImages.some((i) => i.isPrimary)) newImages[0].isPrimary = true;
          update({ images: newImages });
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(label, 'Choose an option', buttons);
  };

  // ─── AI Content ────────────────────────────────────────────────────────────

  const handleGenerateContent = async () => {
    if (!wizardData.type) return;
    setIsGeneratingContent(true);
    try {
      const colors = [...new Set(wizardData.images.map((i) => i.label))];
      const result = await generateContent({
        productType: wizardData.type, category: wizardData.categoryName, colors, sizes: [],
      });
      update({ content: { title: result.title, description: result.description } });
    } catch (err) {
      Alert.alert('AI Error', err.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // ─── AI Image ──────────────────────────────────────────────────────────────

  const primaryImage = wizardData.images.find((img) => img.uploadedUrl);

  const handleGenerateImage = async () => {
    if (!primaryImage?.uploadedUrl) {
      Alert.alert('No image', 'Upload at least one product photo first.');
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
      const result = await generateProductImage({
        imageUrl: primaryImage.uploadedUrl,
        productType: wizardData.type,
        color: primaryImage.label || '',
        category: wizardData.categoryName,
      });
      setGeneratedImageUrl(result.url);
    } catch (err) {
      Alert.alert('Generation Failed', err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const applyGeneratedImage = () => {
    if (!generatedImageUrl) return;
    const updatedImages = wizardData.images.map((img) =>
      img.uploadedUrl === primaryImage.uploadedUrl
        ? { ...img, uploadedUrl: generatedImageUrl, aiGenerated: true }
        : img
    );
    update({ images: updatedImages });
    setGeneratedImageUrl(null);
    Alert.alert('Applied', 'AI-generated image set as your primary photo.');
  };

  // ─── Variants Builder ──────────────────────────────────────────────────────

  const buildVariants = useCallback(() => {
    const t = wizardData.type;
    if (t === 'saree') {
      return selectedColors.map((color) => {
        const found = wizardData.variants.find((v) => v.color === color && v.size === '');
        return found || { color, size: '', quantity: 0, sku: '' };
      });
    }
    if (t === 'dress') {
      const variants = [];
      for (const color of selectedColors) {
        for (const size of selectedSizes) {
          const found = wizardData.variants.find((v) => v.color === color && v.size === size);
          variants.push(found || { color, size, quantity: 0, sku: '' });
        }
      }
      return variants;
    }
    // jewellery
    return selectedWeights.map((w) => {
      const found = wizardData.variants.find((v) => v.size === w);
      return found || { color: goldColor, size: w, quantity: 0, sku: '' };
    });
  }, [wizardData.type, selectedColors, selectedSizes, selectedWeights, goldColor, wizardData.variants]);

  const syncVariants = useCallback(() => {
    const variants = buildVariants();
    const extras = wizardData.type === 'jewellery' ? { purity: goldPurity, goldColor, stoneType } : {};
    update({ variants, extras });
  }, [buildVariants, goldPurity, goldColor, stoneType, update, wizardData.type]);

  const setVariantQty = (color, size, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    const variants = wizardData.variants.map((v) =>
      v.color === color && v.size === size ? { ...v, quantity: qty } : v
    );
    update({ variants });
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const canSave =
    wizardData.content.title.trim().length >= 3 &&
    wizardData.pricing.basePrice > 0;

  const saveProduct = async (publish = false) => {
    if (!canSave) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incomplete', 'Please fill in at least a product name and price.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: wizardData.content.title,
        description: wizardData.content.description,
        type: wizardData.type,
        category_id: wizardData.categoryId || undefined,
        base_price: Number(wizardData.pricing.basePrice),
        discount_pct: Number(wizardData.pricing.discountPct) || 0,
        coupon_code: wizardData.pricing.couponCode || undefined,
        coupon_disc: wizardData.pricing.couponDiscount || undefined,
      };

      let product;
      if (mode === 'edit' && productId) {
        product = await updateProduct(productId, payload);
      } else {
        product = await createProduct(payload);
      }

      for (const img of wizardData.images) {
        if (img.uploadedUrl) {
          await addProductImage(product.id, {
            url: img.uploadedUrl, color: img.label, is_primary: img.isPrimary, alt_text: wizardData.content.title,
          });
        }
      }

      if (wizardData.variants.length > 0) {
        await bulkUpdateVariants(product.id, wizardData.variants.map((v) => ({
          color: v.color, size: v.size, quantity: Number(v.quantity), sku: v.sku,
        })));
      }

      if (publish) await publishProduct(product.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['products'] });
      Alert.alert(
        publish ? 'Published!' : 'Saved!',
        publish ? 'Product is now live on the store.' : 'Product saved as draft.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const typeConfig = PRODUCT_TYPES.find((t) => t.value === wizardData.type);
  const finalPrice = discountedPrice(Number(wizardData.pricing.basePrice) || 0, Number(wizardData.pricing.discountPct) || 0);
  const savings = (Number(wizardData.pricing.basePrice) || 0) - finalPrice;
  const parsedTags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <View className="flex-1" style={{ backgroundColor: WARM_BG, paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center" style={{ backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: SECTION_BORDER }}>
        <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center rounded-full mr-3" style={{ backgroundColor: '#fef2f2' }}>
          <Ionicons name="arrow-back" size={20} color={ACCENT} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold" style={{ color: '#78350f' }}>
            {mode === 'edit' ? 'Edit Product' : 'New Product'}
          </Text>
          <Text className="text-xs" style={{ color: '#a16207' }}>
            {typeConfig?.emoji} {typeConfig?.label}
          </Text>
        </View>
        <Pressable
          onPress={() => Alert.alert('Discard?', 'You will lose unsaved changes.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          ])}
          className="px-3 py-1.5 rounded-lg"
        >
          <Text className="text-xs" style={{ color: '#92400e' }}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ─── 1. Reference Images ──────────────────────────────────────── */}
        <SectionCard icon="camera" iconColor="#db2777" title="Reference Images" subtitle={`${wizardData.images.length}/${photoBlocks.length} photos`}>
          <View className="flex-row flex-wrap justify-between">
            {photoBlocks.map((label) => {
              const img = wizardData.images.find((i) => i.label === label);
              const isUp = uploading === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => !isUp && showPhotoPicker(label)}
                  className="mb-3 rounded-2xl overflow-hidden"
                  style={{ width: '48%', aspectRatio: 1, borderWidth: 1, borderColor: img ? '#f59e0b' : '#e5e7eb' }}
                >
                  {img ? (
                    <View className="flex-1 relative">
                      <Image source={{ uri: img.uri || img.uploadedUrl }} className="w-full h-full" resizeMode="cover" />
                      <View className="absolute bottom-0 left-0 right-0 px-3 py-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <Text className="text-white text-xs font-medium" numberOfLines={1}>{label}</Text>
                      </View>
                      {img.isPrimary && (
                        <View className="absolute top-2 left-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: AMBER_500 }}>
                          <Text className="text-white text-[10px] font-bold">PRIMARY</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#fef7f0', borderStyle: 'dashed' }}>
                      {isUp ? (
                        <ActivityIndicator size="small" color={AMBER_500} />
                      ) : (
                        <>
                          <Text className="text-xs font-medium text-center px-2 mb-1.5" style={{ color: '#92400e' }}>{label}</Text>
                          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: '#fde8d0' }}>
                            <Ionicons name="camera" size={16} color="#d97706" />
                          </View>
                          <Text className="text-[10px] mt-1" style={{ color: '#b45309' }}>Tap to add</Text>
                        </>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* ─── 2. AI Image Generation ───────────────────────────────────── */}
        <SectionCard icon="sparkles" iconColor="#7c3aed" title="Generate AI Image" subtitle="Create a professional studio photo">
          {primaryImage?.uploadedUrl ? (
            <View className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Image source={{ uri: primaryImage.uploadedUrl }} className="w-full" style={{ height: 180 }} resizeMode="cover" />
            </View>
          ) : (
            <View className="rounded-xl p-6 items-center mb-3" style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderStyle: 'dashed', borderColor: '#fde8d0' }}>
              <Ionicons name="image-outline" size={32} color="#d4a017" />
              <Text className="text-xs mt-2" style={{ color: '#92400e' }}>Upload a photo first to generate AI image</Text>
            </View>
          )}

          {generatedImageUrl && (
            <View className="rounded-xl overflow-hidden mb-3" style={{ borderWidth: 2, borderColor: '#16a34a' }}>
              <Image source={{ uri: generatedImageUrl }} className="w-full" style={{ height: 180 }} resizeMode="cover" />
              <View className="flex-row gap-2 p-2" style={{ backgroundColor: '#f0fdf4' }}>
                <Pressable onPress={applyGeneratedImage} className="flex-1 py-2.5 rounded-lg items-center" style={{ backgroundColor: '#16a34a' }}>
                  <Text className="text-white text-xs font-bold">Use This</Text>
                </Pressable>
                <Pressable onPress={handleGenerateImage} className="flex-1 py-2.5 rounded-lg items-center" style={{ backgroundColor: '#f3f4f6' }}>
                  <Text className="text-xs font-semibold" style={{ color: '#374151' }}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            onPress={handleGenerateImage}
            disabled={!primaryImage?.uploadedUrl || isGeneratingImage}
            className="flex-row items-center justify-center py-3.5 rounded-xl"
            style={{ backgroundColor: primaryImage?.uploadedUrl ? '#fef3c7' : '#f9fafb', borderWidth: 1, borderColor: primaryImage?.uploadedUrl ? '#f59e0b' : '#e5e7eb' }}
          >
            {isGeneratingImage ? (
              <ActivityIndicator size="small" color="#d97706" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color={primaryImage?.uploadedUrl ? '#d97706' : '#9ca3af'} />
                <Text className="text-sm font-semibold ml-2" style={{ color: primaryImage?.uploadedUrl ? '#92400e' : '#9ca3af' }}>
                  Generate AI Image
                </Text>
              </>
            )}
          </Pressable>
        </SectionCard>

        <Divider />

        {/* ─── 3. Details ───────────────────────────────────────────────── */}
        <SectionCard icon="gift" iconColor="#b91c1c" title="Details" subtitle="Product information">
          {/* Name */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-medium" style={{ color: '#78350f' }}>Name *</Text>
              <Text className="text-xs" style={{ color: '#a16207' }}>{wizardData.content.title.length}/80</Text>
            </View>
            <TextInput
              className="rounded-xl px-4 py-3 text-base"
              style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
              placeholder="Saree/Dress name"
              placeholderTextColor="#a16207"
              value={wizardData.content.title}
              onChangeText={(t) => update({ content: { ...wizardData.content, title: t } })}
              maxLength={80}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1.5" style={{ color: '#78350f' }}>Description</Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base"
              style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937', minHeight: 100 }}
              placeholder="Describe the item"
              placeholderTextColor="#a16207"
              value={wizardData.content.description}
              onChangeText={(t) => update({ content: { ...wizardData.content, description: t } })}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* AI Content button */}
          <Pressable
            onPress={handleGenerateContent}
            disabled={isGeneratingContent}
            className="flex-row items-center justify-center py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' }}
          >
            {isGeneratingContent ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <>
                <Ionicons name="sparkles" size={14} color="#6366f1" />
                <Text className="text-xs font-semibold ml-1.5" style={{ color: '#4338ca' }}>AI Generate Name & Description</Text>
              </>
            )}
          </Pressable>

          {/* Category */}
          <Text className="text-sm font-medium mb-2" style={{ color: '#78350f' }}>Category</Text>
          <View className="flex-row flex-wrap">
            {allCategories.map((cat) => {
              const active = wizardData.categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => update({ categoryId: cat.id, categoryName: cat.name })}
                  className="px-3.5 py-2 rounded-full border mr-2 mb-2"
                  style={{ backgroundColor: active ? '#fef3c7' : '#fff', borderColor: active ? '#f59e0b' : '#e5e7eb' }}
                >
                  <Text className="text-xs font-semibold" style={{ color: active ? '#92400e' : '#6b7280' }}>{cat.name}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowNewCategory(true)}
              className="px-3.5 py-2 rounded-full mr-2 mb-2 flex-row items-center"
              style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#a16207' }}
            >
              <Ionicons name="add" size={14} color="#a16207" />
              <Text className="text-xs font-semibold ml-1" style={{ color: '#a16207' }}>New</Text>
            </Pressable>
          </View>

          {showNewCategory && (
            <View className="flex-row items-center gap-2 mt-2">
              <TextInput
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
                placeholder="Category name"
                placeholderTextColor="#a16207"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <Pressable
                onPress={() => {
                  const name = newCategoryName.trim();
                  if (!name) return;
                  const newCat = { id: `custom-${Date.now()}`, name, slug: name.toLowerCase().replace(/\s+/g, '-') };
                  setCustomCategories((prev) => [...prev, newCat]);
                  update({ categoryId: newCat.id, categoryName: newCat.name });
                  setNewCategoryName('');
                  setShowNewCategory(false);
                }}
                className="px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: AMBER_500 }}
              >
                <Text className="text-white text-sm font-semibold">Add</Text>
              </Pressable>
            </View>
          )}
        </SectionCard>

        {/* ─── 4. Pricing ───────────────────────────────────────────────── */}
        <SectionCard icon="pricetag" iconColor="#d97706" title="Pricing" subtitle="Set price and discount">
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1.5" style={{ color: '#78350f' }}>Price (Rs) *</Text>
              <View className="flex-row items-center rounded-xl overflow-hidden" style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER }}>
                <View className="px-3 py-3" style={{ backgroundColor: '#fde8d0' }}>
                  <Text className="text-sm font-bold" style={{ color: '#92400e' }}>₹</Text>
                </View>
                <TextInput
                  className="flex-1 px-3 py-3 text-base font-semibold"
                  style={{ color: '#1f2937' }}
                  placeholder="0"
                  placeholderTextColor="#a16207"
                  keyboardType="number-pad"
                  value={wizardData.pricing.basePrice ? wizardData.pricing.basePrice.toString() : ''}
                  onChangeText={(t) => update({ pricing: { ...wizardData.pricing, basePrice: parseInt(t) || 0 } })}
                />
              </View>
            </View>
            <View style={{ width: 100 }}>
              <Text className="text-xs font-medium mb-1.5" style={{ color: '#78350f' }}>Discount (%)</Text>
              <TextInput
                className="rounded-xl px-3 py-3 text-base text-center"
                style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
                placeholder="0"
                placeholderTextColor="#a16207"
                keyboardType="number-pad"
                value={wizardData.pricing.discountPct ? wizardData.pricing.discountPct.toString() : ''}
                onChangeText={(t) => update({ pricing: { ...wizardData.pricing, discountPct: Math.min(90, parseInt(t) || 0) } })}
              />
            </View>
          </View>

          {Number(wizardData.pricing.basePrice) > 0 && (
            <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' }}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: '#78350f' }}>Base price</Text>
                <Text className="text-xs font-semibold" style={{ color: '#78350f' }}>{formatPrice(wizardData.pricing.basePrice)}</Text>
              </View>
              {Number(wizardData.pricing.discountPct) > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs" style={{ color: '#78350f' }}>Discount ({wizardData.pricing.discountPct}%)</Text>
                  <Text className="text-xs font-semibold" style={{ color: '#dc2626' }}>-{formatPrice(savings)}</Text>
                </View>
              )}
              <View className="flex-row justify-between pt-1" style={{ borderTopWidth: 1, borderTopColor: '#fde68a' }}>
                <Text className="text-sm font-bold" style={{ color: '#78350f' }}>Customer pays</Text>
                <Text className="text-sm font-bold" style={{ color: '#b45309' }}>{formatPrice(finalPrice)}</Text>
              </View>
            </View>
          )}

          {/* Coupon */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold" style={{ color: '#78350f' }}>Coupon code</Text>
            <Switch
              value={hasCoupon}
              onValueChange={(v) => {
                setHasCoupon(v);
                if (!v) update({ pricing: { ...wizardData.pricing, couponCode: '', couponDiscount: 0 } });
              }}
              trackColor={{ false: '#e5e7eb', true: '#fcd34d' }}
              thumbColor={hasCoupon ? AMBER_500 : '#9ca3af'}
            />
          </View>
          {hasCoupon && (
            <View className="flex-row gap-2 mb-4">
              <TextInput
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
                placeholder="SUMMER20"
                placeholderTextColor="#a16207"
                value={wizardData.pricing.couponCode}
                onChangeText={(t) => update({ pricing: { ...wizardData.pricing, couponCode: t.toUpperCase() } })}
                autoCapitalize="characters"
              />
              <TextInput
                className="rounded-xl px-3 py-2.5 text-sm text-center"
                style={{ width: 70, backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
                placeholder="%"
                placeholderTextColor="#a16207"
                keyboardType="number-pad"
                value={wizardData.pricing.couponDiscount ? wizardData.pricing.couponDiscount.toString() : ''}
                onChangeText={(t) => update({ pricing: { ...wizardData.pricing, couponDiscount: parseInt(t) || 0 } })}
              />
            </View>
          )}

          {/* Tags */}
          <Text className="text-xs font-medium mb-1.5" style={{ color: '#78350f' }}>Tags</Text>
          <TextInput
            className="rounded-xl px-3 py-2.5 text-sm mb-2"
            style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER, color: '#1f2937' }}
            placeholder="wedding, festive, silk"
            placeholderTextColor="#a16207"
            value={tagInput}
            onChangeText={(t) => { setTagInput(t); update({ pricing: { ...wizardData.pricing, tags: t } }); }}
          />
          {parsedTags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {parsedTags.map((tag) => (
                <View key={tag} className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' }}>
                  <Text className="text-[10px] font-medium" style={{ color: '#4338ca' }}>{tag}</Text>
                  <Pressable
                    onPress={() => {
                      const updated = parsedTags.filter((t) => t !== tag).join(', ');
                      setTagInput(updated);
                      update({ pricing: { ...wizardData.pricing, tags: updated } });
                    }}
                    hitSlop={6}
                    className="ml-1"
                  >
                    <Ionicons name="close-circle" size={12} color="#6366f1" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        <Divider />

        {/* ─── 5. Variants (type-specific) ──────────────────────────────── */}
        <SectionCard
          icon="layers"
          iconColor="#14b8a6"
          title={wizardData.type === 'saree' ? 'Colors & Pieces' : wizardData.type === 'dress' ? 'Sizes, Colors & Pieces' : 'Weight, Purity & Pieces'}
          subtitle="Stock configuration"
        >
          {wizardData.type === 'saree' && (
            <>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Colors</Text>
              <View className="flex-row flex-wrap mb-3">
                {COLORS.map((c) => (
                  <Chip
                    key={c} label={c} colorDot={COLOR_MAP[c]}
                    selected={selectedColors.includes(c)}
                    onPress={() => {
                      setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
                      setTimeout(syncVariants, 0);
                    }}
                  />
                ))}
              </View>
              {selectedColors.length > 0 && (
                <View className="rounded-xl p-3" style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER }}>
                  {selectedColors.map((color) => {
                    const v = wizardData.variants.find((vr) => vr.color === color);
                    return (
                      <View key={color} className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                          <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: COLOR_MAP[color] || '#ccc', borderWidth: 1, borderColor: '#e5e7eb' }} />
                          <Text className="text-sm" style={{ color: '#78350f' }}>{color}</Text>
                        </View>
                        <TextInput
                          className="w-20 text-center rounded-lg py-1.5 text-sm font-semibold"
                          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' }}
                          value={(v?.quantity ?? 0).toString()}
                          onChangeText={(t) => setVariantQty(color, '', t)}
                          keyboardType="number-pad"
                          selectTextOnFocus
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {wizardData.type === 'dress' && (
            <>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Sizes</Text>
              <View className="flex-row flex-wrap mb-3">
                {PRODUCT_SIZES.dress.map((s) => (
                  <Chip
                    key={s} label={s}
                    selected={selectedSizes.includes(s)}
                    onPress={() => {
                      setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
                      setTimeout(syncVariants, 0);
                    }}
                  />
                ))}
              </View>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Colors</Text>
              <View className="flex-row flex-wrap mb-3">
                {COLORS.map((c) => (
                  <Chip
                    key={c} label={c} colorDot={COLOR_MAP[c]}
                    selected={selectedColors.includes(c)}
                    onPress={() => {
                      setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
                      setTimeout(syncVariants, 0);
                    }}
                  />
                ))}
              </View>
              {selectedColors.length > 0 && selectedSizes.length > 0 && (
                <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: SECTION_BORDER }}>
                  {selectedColors.map((color) => (
                    <View key={color}>
                      <View className="px-3 py-2" style={{ backgroundColor: '#fef3c7' }}>
                        <Text className="text-xs font-bold" style={{ color: '#92400e' }}>{color}</Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 p-3" style={{ backgroundColor: '#fef7f0' }}>
                        {selectedSizes.map((size) => {
                          const v = wizardData.variants.find((vr) => vr.color === color && vr.size === size);
                          return (
                            <View key={size} className="items-center" style={{ width: 68 }}>
                              <Text className="text-[10px] mb-1" style={{ color: '#78350f' }}>{size}</Text>
                              <TextInput
                                className="w-full text-center rounded-lg py-1.5 text-xs font-semibold"
                                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' }}
                                value={(v?.quantity ?? 0).toString()}
                                onChangeText={(t) => setVariantQty(color, size, t)}
                                keyboardType="number-pad"
                                selectTextOnFocus
                              />
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {wizardData.type === 'jewellery' && (
            <>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Purity</Text>
              <View className="flex-row flex-wrap mb-3">
                {GOLD_PURITIES.map((p) => (
                  <Chip key={p} label={p} selected={goldPurity === p} onPress={() => { setGoldPurity(p); setTimeout(syncVariants, 0); }} />
                ))}
              </View>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Gold Color</Text>
              <View className="flex-row flex-wrap mb-3">
                {GOLD_COLORS.map((gc) => (
                  <Chip key={gc} label={gc} selected={goldColor === gc} onPress={() => { setGoldColor(gc); setTimeout(syncVariants, 0); }} />
                ))}
              </View>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Stone</Text>
              <View className="flex-row flex-wrap mb-3">
                {STONE_TYPES.map((st) => (
                  <Chip key={st} label={st} selected={stoneType === st} onPress={() => { setStoneType(st); setTimeout(syncVariants, 0); }} />
                ))}
              </View>
              <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#78350f' }}>Weight</Text>
              <View className="flex-row flex-wrap mb-3">
                {PRODUCT_SIZES.jewellery.map((w) => (
                  <Chip
                    key={w} label={w}
                    selected={selectedWeights.includes(w)}
                    onPress={() => {
                      setSelectedWeights((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);
                      setTimeout(syncVariants, 0);
                    }}
                  />
                ))}
              </View>
              {selectedWeights.length > 0 && (
                <View className="rounded-xl p-3" style={{ backgroundColor: '#fef7f0', borderWidth: 1, borderColor: SECTION_BORDER }}>
                  {selectedWeights.map((w) => {
                    const v = wizardData.variants.find((vr) => vr.size === w);
                    return (
                      <View key={w} className="flex-row items-center justify-between py-2">
                        <Text className="text-sm" style={{ color: '#78350f' }}>{w}</Text>
                        <TextInput
                          className="w-20 text-center rounded-lg py-1.5 text-sm font-semibold"
                          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' }}
                          value={(v?.quantity ?? 0).toString()}
                          onChangeText={(t) => setVariantQty(goldColor, w, t)}
                          keyboardType="number-pad"
                          selectTextOnFocus
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </SectionCard>
      </ScrollView>

      {/* ─── Sticky Footer ────────────────────────────────────────────── */}
      <View
        style={{ paddingBottom: insets.bottom + 8, backgroundColor: CARD_BG, borderTopWidth: 1, borderTopColor: SECTION_BORDER }}
        className="px-4 pt-3"
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => saveProduct(false)}
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-xl items-center"
            style={{ borderWidth: 2, borderColor: '#d4a017', opacity: isSaving ? 0.6 : 1 }}
          >
            {isSaving ? <ActivityIndicator size="small" color="#d4a017" /> : (
              <Text className="font-semibold text-sm" style={{ color: '#92400e' }}>Save Draft</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => saveProduct(true)}
            disabled={isSaving || !canSave}
            className="flex-1 py-3.5 rounded-xl items-center"
            style={{ backgroundColor: canSave ? AMBER_500 : '#e5e7eb', opacity: isSaving ? 0.6 : 1 }}
          >
            {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
              <Text className="text-white font-bold text-sm">Publish</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
