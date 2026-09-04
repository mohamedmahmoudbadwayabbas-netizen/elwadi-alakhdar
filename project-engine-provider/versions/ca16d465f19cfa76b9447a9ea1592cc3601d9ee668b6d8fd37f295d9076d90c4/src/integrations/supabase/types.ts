export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      cart_items: {
        Row: { created_at: string | null; id: string; product_id: string | null; quantity: number | null; user_id: string | null }
        Insert: { created_at?: string | null; id?: string; product_id?: string | null; quantity?: number | null; user_id?: string | null }
        Update: { created_at?: string | null; id?: string; product_id?: string | null; quantity?: number | null; user_id?: string | null }
        Relationships: [{ foreignKeyName: "cart_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      }
      categories: {
        Row: { created_at: string | null; id: string; image_url: string | null; name: string; name_ar: string | null; slug: string }
        Insert: { created_at?: string | null; id?: string; image_url?: string | null; name: string; name_ar?: string | null; slug: string }
        Update: { created_at?: string | null; id?: string; image_url?: string | null; name?: string; name_ar?: string | null; slug?: string }
        Relationships: []
      }
      coupons: {
        Row: { code: string; created_at: string; discount_type: string; discount_value: number; expires_at: string | null; id: string; is_active: boolean; min_order_amount: number | null; usage_limit: number | null; used_count: number }
        Insert: { code: string; created_at?: string; discount_type: string; discount_value: number; expires_at?: string | null; id?: string; is_active?: boolean; min_order_amount?: number | null; usage_limit?: number | null; used_count?: number }
        Update: { code?: string; created_at?: string; discount_type?: string; discount_value?: number; expires_at?: string | null; id?: string; is_active?: boolean; min_order_amount?: number | null; usage_limit?: number | null; used_count?: number }
        Relationships: []
      }
      delivery_zones: {
        Row: { area: string | null; city: string | null; country: string; created_at: string; estimated_minutes: number | null; fee: number; governorate: string | null; id: string; is_active: boolean; min_order_amount: number | null; name: string; sort_order: number }
        Insert: { area?: string | null; city?: string | null; country?: string; created_at?: string; estimated_minutes?: number | null; fee?: number; governorate?: string | null; id?: string; is_active?: boolean; min_order_amount?: number | null; name: string; sort_order?: number }
        Update: { area?: string | null; city?: string | null; country?: string; created_at?: string; estimated_minutes?: number | null; fee?: number; governorate?: string | null; id?: string; is_active?: boolean; min_order_amount?: number | null; name?: string; sort_order?: number }
        Relationships: []
      }
      order_items: {
        Row: { id: string; order_id: string | null; price: number; product_id: string | null; quantity: number }
        Insert: { id?: string; order_id?: string | null; price: number; product_id?: string | null; quantity: number }
        Update: { id?: string; order_id?: string | null; price?: number; product_id?: string | null; quantity?: number }
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ]
      }
      orders: {
        Row: { address: string | null; coupon_code: string | null; created_at: string | null; customer_name: string | null; delivery_fee: number | null; delivery_method: string | null; delivery_zone_id: string | null; discount_amount: number | null; id: string; notes: string | null; payment_method: string | null; payment_reference: string | null; phone: string | null; ref_source: string | null; shipping_address: Json | null; status: string | null; total_amount: number; user_id: string | null }
        Insert: { address?: string | null; coupon_code?: string | null; created_at?: string | null; customer_name?: string | null; delivery_fee?: number | null; delivery_method?: string | null; delivery_zone_id?: string | null; discount_amount?: number | null; id?: string; notes?: string | null; payment_method?: string | null; payment_reference?: string | null; phone?: string | null; ref_source?: string | null; shipping_address?: Json | null; status?: string | null; total_amount: number; user_id?: string | null }
        Update: { address?: string | null; coupon_code?: string | null; created_at?: string | null; customer_name?: string | null; delivery_fee?: number | null; delivery_method?: string | null; delivery_zone_id?: string | null; discount_amount?: number | null; id?: string; notes?: string | null; payment_method?: string | null; payment_reference?: string | null; phone?: string | null; ref_source?: string | null; shipping_address?: Json | null; status?: string | null; total_amount?: number; user_id?: string | null }
        Relationships: []
      }
      products: {
        Row: { category_id: string | null; created_at: string | null; description: string | null; description_ar: string | null; id: string; image_url: string | null; images: string[] | null; is_active: boolean | null; is_featured: boolean | null; name: string; name_ar: string | null; original_price: number | null; price: number; rating: number | null; reviews_count: number | null; stock: number | null }
        Insert: { category_id?: string | null; created_at?: string | null; description?: string | null; description_ar?: string | null; id?: string; image_url?: string | null; images?: string[] | null; is_active?: boolean | null; is_featured?: boolean | null; name: string; name_ar?: string | null; original_price?: number | null; price: number; rating?: number | null; reviews_count?: number | null; stock?: number | null }
        Update: { category_id?: string | null; created_at?: string | null; description?: string | null; description_ar?: string | null; id?: string; image_url?: string | null; images?: string[] | null; is_active?: boolean | null; is_featured?: boolean | null; name?: string; name_ar?: string | null; original_price?: number | null; price?: number; rating?: number | null; reviews_count?: number | null; stock?: number | null }
        Relationships: [{ foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      profiles: {
        Row: { address: string | null; city: string | null; full_name: string | null; id: string; phone: string | null; role: string | null; updated_at: string | null }
        Insert: { address?: string | null; city?: string | null; full_name?: string | null; id: string; phone?: string | null; role?: string | null; updated_at?: string | null }
        Update: { address?: string | null; city?: string | null; full_name?: string | null; id?: string; phone?: string | null; role?: string | null; updated_at?: string | null }
        Relationships: []
      }
      store_settings: {
        Row: { accent_color: string; announcement_bg_color: string; announcement_enabled: boolean; announcement_text: string; background_color: string; bank_account_info: string | null; cart_empty_bg: string | null; created_at: string; default_delivery_fee: number; favicon_url: string | null; first_order_coupon_code: string | null; first_order_coupon_enabled: boolean; first_order_discount_percent: number; floating_element_image: string | null; font_family: string; foreground_color: string; free_shipping_threshold: number; ga4_id: string | null; hero_bg_image: string | null; hero_cta_text: string | null; hero_image_url: string | null; hero_subtitle: string | null; hero_title: string | null; id: string; instapay_handle: string | null; login_bg_pattern: string | null; logo_url: string | null; meta_pixel_id: string | null; min_order_amount: number; primary_color: string; site_name: string; store_address: string | null; store_lat: number | null; store_lng: number | null; updated_at: string; whatsapp_number: string | null }
        Insert: { accent_color?: string; announcement_bg_color?: string; announcement_enabled?: boolean; announcement_text?: string; background_color?: string; bank_account_info?: string | null; cart_empty_bg?: string | null; created_at?: string; default_delivery_fee?: number; favicon_url?: string | null; first_order_coupon_code?: string | null; first_order_coupon_enabled?: boolean; first_order_discount_percent?: number; floating_element_image?: string | null; font_family?: string; foreground_color?: string; free_shipping_threshold?: number; ga4_id?: string | null; hero_bg_image?: string | null; hero_cta_text?: string | null; hero_image_url?: string | null; hero_subtitle?: string | null; hero_title?: string | null; id?: string; instapay_handle?: string | null; login_bg_pattern?: string | null; logo_url?: string | null; meta_pixel_id?: string | null; min_order_amount?: number; primary_color?: string; site_name?: string; store_address?: string | null; store_lat?: number | null; store_lng?: number | null; updated_at?: string; whatsapp_number?: string | null }
        Update: { accent_color?: string; announcement_bg_color?: string; announcement_enabled?: boolean; announcement_text?: string; background_color?: string; bank_account_info?: string | null; cart_empty_bg?: string | null; created_at?: string; default_delivery_fee?: number; favicon_url?: string | null; first_order_coupon_code?: string | null; first_order_coupon_enabled?: boolean; first_order_discount_percent?: number; floating_element_image?: string | null; font_family?: string; foreground_color?: string; free_shipping_threshold?: number; ga4_id?: string | null; hero_bg_image?: string | null; hero_cta_text?: string | null; hero_image_url?: string | null; hero_subtitle?: string | null; hero_title?: string | null; id?: string; instapay_handle?: string | null; login_bg_pattern?: string | null; logo_url?: string | null; meta_pixel_id?: string | null; min_order_amount?: number; primary_color?: string; site_name?: string; store_address?: string | null; store_lat?: number | null; store_lng?: number | null; updated_at?: string; whatsapp_number?: string | null }
        Relationships: []
      }
      user_roles: {
        Row: { created_at: string; id: number; role: string | null; user_id: string | null }
        Insert: { created_at?: string; id?: number; role?: string | null; user_id?: string | null }
        Update: { created_at?: string; id?: number; role?: string | null; user_id?: string | null }
        Relationships: []
      }
    }
    Views: {
      store_settings_public: {
        Row: { accent_color: string | null; announcement_bg_color: string | null; announcement_enabled: boolean | null; announcement_text: string | null; background_color: string | null; cart_empty_bg: string | null; created_at: string | null; default_delivery_fee: number | null; favicon_url: string | null; first_order_coupon_code: string | null; first_order_coupon_enabled: boolean | null; first_order_discount_percent: number | null; floating_element_image: string | null; font_family: string | null; foreground_color: string | null; free_shipping_threshold: number | null; ga4_id: string | null; hero_bg_image: string | null; hero_cta_text: string | null; hero_image_url: string | null; hero_subtitle: string | null; hero_title: string | null; id: string | null; login_bg_pattern: string | null; logo_url: string | null; meta_pixel_id: string | null; min_order_amount: number | null; primary_color: string | null; site_name: string | null; store_address: string | null; store_lat: number | null; store_lng: number | null; updated_at: string | null; whatsapp_number: string | null }
        Insert: { accent_color?: string | null; announcement_bg_color?: string | null; announcement_enabled?: boolean | null; announcement_text?: string | null; background_color?: string | null; cart_empty_bg?: string | null; created_at?: string | null; default_delivery_fee?: number | null; favicon_url?: string | null; first_order_coupon_code?: string | null; first_order_coupon_enabled?: boolean | null; first_order_discount_percent?: number | null; floating_element_image?: string | null; font_family?: string | null; foreground_color?: string | null; free_shipping_threshold?: number | null; ga4_id?: string | null; hero_bg_image?: string | null; hero_cta_text?: string | null; hero_image_url?: string | null; hero_subtitle?: string | null; hero_title?: string | null; id?: string | null; login_bg_pattern?: string | null; logo_url?: string | null; meta_pixel_id?: string | null; min_order_amount?: number | null; primary_color?: string | null; site_name?: string | null; store_address?: string | null; store_lat?: number | null; store_lng?: number | null; updated_at?: string | null; whatsapp_number?: string | null }
        Update: { accent_color?: string | null; announcement_bg_color?: string | null; announcement_enabled?: boolean | null; announcement_text?: string | null; background_color?: string | null; cart_empty_bg?: string | null; created_at?: string | null; default_delivery_fee?: number | null; favicon_url?: string | null; first_order_coupon_code?: string | null; first_order_coupon_enabled?: boolean | null; first_order_discount_percent?: number | null; floating_element_image?: string | null; font_family?: string | null; foreground_color?: string | null; free_shipping_threshold?: number | null; ga4_id?: string | null; hero_bg_image?: string | null; hero_cta_text?: string | null; hero_image_url?: string | null; hero_subtitle?: string | null; hero_title?: string | null; id?: string | null; login_bg_pattern?: string | null; logo_url?: string | null; meta_pixel_id?: string | null; min_order_amount?: number | null; primary_color?: string | null; site_name?: string | null; store_address?: string | null; store_lat?: number | null; store_lng?: number | null; updated_at?: string | null; whatsapp_number?: string | null }
        Relationships: []
      }
    }
    Functions: {
      create_order: { Args: { p_address: string; p_coupon_code: string; p_customer_name: string; p_delivery_method: string; p_delivery_zone_id: string; p_items: Json; p_notes: string; p_payment_method: string; p_payment_reference: string; p_phone: string; p_ref_source: string }; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_payment_config: { Args: never; Returns: { bank_account_info: string; instapay_handle: string; store_address: string }[] }
      is_admin: { Args: never; Returns: boolean }
      validate_coupon: { Args: { p_code: string; p_subtotal: number }; Returns: { code: string; discount_type: string; discount_value: number }[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never : never
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never : never
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = { public: { Enums: {} } } as const
