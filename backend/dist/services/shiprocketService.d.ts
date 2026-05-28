export interface CourierOption {
    courier_company_id: number;
    courier_name: string;
    rate: number;
    estimated_delivery_days: string;
    etd: string;
    cod: number;
    rating: number;
    freight_charge?: number;
}
export interface CreateAdhocOrderPayload {
    order_id: string;
    order_date: string;
    pickup_location: string;
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_address_2?: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    order_items: Array<{
        name: string;
        sku: string;
        units: number;
        selling_price: number;
        discount?: number;
    }>;
    payment_method: 'Prepaid' | 'COD';
    sub_total: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}
export interface CreateOrderResult {
    order_id: number;
    shipment_id: number;
}
export interface AssignAwbResult {
    awb_code: string;
    courier_name: string;
    courier_company_id?: number;
}
export interface TrackingPayload {
    tracking_data?: {
        track_status?: number;
        shipment_status?: string;
        shipment_track?: Array<{
            current_status?: string;
            date?: string;
            activity?: string;
            location?: string;
        }>;
    };
}
export declare function checkServiceability(params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number;
    cod?: 0 | 1;
    order_id?: string;
}): Promise<CourierOption[]>;
export declare function createAdhocOrder(payload: CreateAdhocOrderPayload): Promise<CreateOrderResult>;
export declare function assignAwb(shipment_id: number, courier_id: number): Promise<AssignAwbResult>;
export declare function generateLabel(shipment_ids: number[]): Promise<string>;
export declare function generateInvoice(order_ids: number[]): Promise<string>;
export declare function generateManifest(shipment_ids: number[]): Promise<string>;
export declare function trackByAwb(awb: string): Promise<TrackingPayload>;
export declare function cancelByAwbs(awbs: string[]): Promise<void>;
export declare function getPickupLocation(): string;
export declare function getPickupPincode(): string;
//# sourceMappingURL=shiprocketService.d.ts.map