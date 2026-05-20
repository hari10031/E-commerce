import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProduct, updateProduct, publishProduct,
  addProductImage, bulkUpdateVariants,
} from '../../../lib/api';
import * as Haptics from 'expo-haptics';

import Step1TypeCategory from './Step1TypeCategory';
import Step2Images from './Step2Images';
import Step3Variants from './Step3Variants';
import Step4Content from './Step4Content';
import Step5Pricing from './Step5Pricing';
import Step6Review from './Step6Review';

const STEPS = ['Type', 'Images', 'Variants', 'Content', 'Pricing', 'Review'];

const emptyWizardData = () => ({
  type: '',
  categoryId: '',
  images: [],
  variants: [],
  content: { title: '', description: '' },
  pricing: { basePrice: 0, discountPct: 0, couponCode: '', couponDiscount: 0 },
});

function isStepValid(step, data) {
  switch (step) {
    case 0: return !!data.type && !!data.categoryId;
    case 1: return data.images.length > 0 && data.images.every((i) => i.uploadedUrl);
    case 2: return data.variants.some((v) => v.quantity > 0);
    case 3: return data.content.title.trim().length >= 3;
    case 4: return data.pricing.basePrice > 0;
    case 5: return true;
    default: return true;
  }
}

export default function ProductWizardScreen({ route, navigation }) {
  const { mode = 'create', productId } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [wizardData, setWizardData] = useState(emptyWizardData());
  const [isSaving, setIsSaving] = useState(false);

  const update = (partial) => setWizardData((prev) => ({ ...prev, ...partial }));

  const saveProduct = async (publish = false) => {
    setIsSaving(true);
    try {
      const payload = {
        title: wizardData.content.title,
        description: wizardData.content.description,
        type: wizardData.type,
        category_id: wizardData.categoryId,
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

      // Add images
      for (const img of wizardData.images) {
        if (img.uploadedUrl) {
          await addProductImage(product.id, {
            url: img.uploadedUrl,
            color: img.color,
            is_primary: img.isPrimary,
            alt_text: wizardData.content.title,
          });
        }
      }

      // Bulk update variants
      if (wizardData.variants.length > 0) {
        await bulkUpdateVariants(product.id, wizardData.variants.map((v) => ({
          color: v.color,
          size: v.size,
          quantity: Number(v.quantity),
          sku: v.sku,
        })));
      }

      if (publish) {
        await publishProduct(product.id);
      }

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

  const goNext = () => {
    if (!isStepValid(step, wizardData)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incomplete', 'Please complete all required fields before continuing.');
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  const renderStep = () => {
    const props = { wizardData, update };
    switch (step) {
      case 0: return <Step1TypeCategory {...props} />;
      case 1: return <Step2Images {...props} />;
      case 2: return <Step3Variants {...props} />;
      case 3: return <Step4Content {...props} />;
      case 4: return <Step5Pricing {...props} />;
      case 5: return <Step6Review {...props} onSaveDraft={() => saveProduct(false)} onPublish={() => saveProduct(true)} isSaving={isSaving} />;
      default: return null;
    }
  };

  const valid = isStepValid(step, wizardData);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center mb-4">
          <Pressable onPress={goBack} className="w-9 h-9 items-center justify-center rounded-full mr-2 active:bg-gray-100">
            <Ionicons name="arrow-back" size={22} color="#1f2937" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Product' : 'New Product'}
            </Text>
            <Text className="text-xs text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</Text>
          </View>
        </View>

        {/* Step indicators */}
        <View className="flex-row gap-1.5">
          {STEPS.map((s, i) => (
            <Pressable
              key={s}
              onPress={() => i < step && setStep(i)}
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#f3f4f6' }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: i < step ? '#f59e0b' : i === step ? '#fcd34d' : 'transparent',
                  width: i < step ? '100%' : i === step ? '60%' : '0%',
                }}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Step content */}
      <View className="flex-1">{renderStep()}</View>

      {/* Navigation buttons (hidden on last step — Step6Review has its own) */}
      {step < STEPS.length - 1 && (
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="bg-white border-t border-gray-100 px-4 pt-3"
        >
          <Pressable
            onPress={goNext}
            className="bg-amber-500 rounded-xl py-4 items-center active:bg-amber-600"
            style={{ opacity: valid ? 1 : 0.5 }}
          >
            <Text className="text-white font-semibold text-base">Continue</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
