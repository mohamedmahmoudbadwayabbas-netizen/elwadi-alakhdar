export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_data: Json
          created_at: string
          id: string
          phone: string | null
          recovered: boolean | null
          reminded_at: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_data: Json
          created_at?: string
          id?: string
          phone?: string | null
          recovered?: boolean | null
          reminded_at?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_data?: Json
          created_at?: string
          id?: string
          phone?: string | null
          recovered?: boolean | null
          reminded_at?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          apartment: string | null
          area: string | null
          building: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          notes: string | null
          phone: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment?: string | null
          area?: string | null
          building?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          notes?: string | null
          phone: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment?: string | null
          area?: string | null
          building?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          notes?: string | null
          phone?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount: number
          id?: string
          order_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          first_order_only: boolean | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      delivery_slots: {
        Row: {
          created_at: string
          end_hour: number
          id: string
          is_active: boolean | null
          label: string
          sort_order: number | null
          start_hour: number
        }
        Insert: {
          created_at?: string
          end_hour: number
          id?: string
          is_active?: boolean | null
          label: string
          sort_order?: number | null
          start_hour: number
        }
        Update: {
          created_at?: string
          end_hour?: number
          id?: string
          is_active?: boolean | null
          label?: string
          sort_order?: number | null
          start_hour?: number
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          estimated_minutes: number | null
          fee: number
          id: string
          is_active: boolean | null
          min_order_amount: number | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number | null
          fee?: number
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number | null
          fee?: number
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      flash_offers: {
        Row: {
          banner_image_url: string | null
          created_at: string
          discount_percent: number
          ends_at: string
          id: string
          is_active: boolean | null
          product_id: string | null
          starts_at: string
          title: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          discount_percent?: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          starts_at?: string
          title: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          discount_percent?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          created_at: string
          cta_text: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_name: string
          delivery_date: string | null
          delivery_fee: number | null
          delivery_slot: string | null
          delivery_zone_id: string | null
          discount_amount: number | null
          id: string
          items: Json
          notes: string | null
          payment_method: string
          payment_reference: string | null
          phone: string
          ref_source: string | null
          status: string
          total_price: number
          tracking_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_name: string
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_slot?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          phone: string
          ref_source?: string | null
          status?: string
          total_price: number
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_name?: string
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_slot?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          phone?: string
          ref_source?: string | null
          status?: string
          total_price?: number
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          buy_quantity: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          name: string
          pay_quantity: number
          product_ids: string[]
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          buy_quantity?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pay_quantity?: number
          product_ids?: string[]
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          buy_quantity?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pay_quantity?: number
          product_ids?: string[]
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badges: string[] | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_by_weight: boolean
          is_featured: boolean
          is_on_sale: boolean
          is_popular: boolean
          low_stock_threshold: number
          name: string
          old_price: number | null
          price_per_unit: number
          stock_quantity: number
          unit_label: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          badges?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean
          is_featured?: boolean
          is_on_sale?: boolean
          is_popular?: boolean
          low_stock_threshold?: number
          name: string
          old_price?: number | null
          price_per_unit: number
          stock_quantity?: number
          unit_label?: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          badges?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean
          is_featured?: boolean
          is_on_sale?: boolean
          is_popular?: boolean
          low_stock_threshold?: number
          name?: string
          old_price?: number | null
          price_per_unit?: number
          stock_quantity?: number
          unit_label?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          reason: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          reason: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          author_name: string
          comment: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          author_name?: string
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          accent_color: string | null
          announcement_bg_color: string | null
          announcement_enabled: boolean | null
          announcement_text: string | null
          background_color: string | null
          bank_account_info: string | null
          cart_empty_bg: string | null
          created_at: string
          dark_mode_enabled: boolean | null
          default_delivery_fee: number | null
          favicon_url: string | null
          first_order_coupon_code: string | null
          first_order_coupon_enabled: boolean | null
          first_order_discount_percent: number | null
          floating_element_image: string | null
          font_family: string | null
          foreground_color: string | null
          free_shipping_threshold: number | null
          ga4_id: string | null
          hero_bg_image: string | null
          hero_cta_text: string
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          id: string
          instapay_handle: string | null
          login_bg_pattern: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          min_order_amount: number | null
          primary_color: string | null
          site_name: string | null
          store_address: string | null
          store_lat: number | null
          store_lng: number | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string | null
          announcement_bg_color?: string | null
          announcement_enabled?: boolean | null
          announcement_text?: string | null
          background_color?: string | null
          bank_account_info?: string | null
          cart_empty_bg?: string | null
          created_at?: string
          dark_mode_enabled?: boolean | null
          default_delivery_fee?: number | null
          favicon_url?: string | null
          first_order_coupon_code?: string | null
          first_order_coupon_enabled?: boolean | null
          first_order_discount_percent?: number | null
          floating_element_image?: string | null
          font_family?: string | null
          foreground_color?: string | null
          free_shipping_threshold?: number | null
          ga4_id?: string | null
          hero_bg_image?: string | null
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          instapay_handle?: string | null
          login_bg_pattern?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          min_order_amount?: number | null
          primary_color?: string | null
          site_name?: string | null
          store_address?: string | null
          store_lat?: number | null
          store_lng?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string | null
          announcement_bg_color?: string | null
          announcement_enabled?: boolean | null
          announcement_text?: string | null
          background_color?: string | null
          bank_account_info?: string | null
          cart_empty_bg?: string | null
          created_at?: string
          dark_mode_enabled?: boolean | null
          default_delivery_fee?: number | null
          favicon_url?: string | null
          first_order_coupon_code?: string | null
          first_order_coupon_enabled?: boolean | null
          first_order_discount_percent?: number | null
          floating_element_image?: string | null
          font_family?: string | null
          foreground_color?: string | null
          free_shipping_threshold?: number | null
          ga4_id?: string | null
          hero_bg_image?: string | null
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          instapay_handle?: string | null
          login_bg_pattern?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          min_order_amount?: number | null
          primary_color?: string | null
          site_name?: string | null
          store_address?: string | null
          store_lat?: number | null
          store_lng?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_hex: string
          auth_bg_url: string | null
          card_radius_px: number
          cart_empty_bg_url: string | null
          created_at: string
          dark_marble_bg_url: string | null
          hero_cta_text: string | null
          hero_grid_images: Json
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          marble_bg_url: string | null
          primary_hex: string
          updated_at: string
        }
        Insert: {
          accent_hex?: string
          auth_bg_url?: string | null
          card_radius_px?: number
          cart_empty_bg_url?: string | null
          created_at?: string
          dark_marble_bg_url?: string | null
          hero_cta_text?: string | null
          hero_grid_images?: Json
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          marble_bg_url?: string | null
          primary_hex?: string
          updated_at?: string
        }
        Update: {
          accent_hex?: string
          auth_bg_url?: string | null
          card_radius_px?: number
          cart_empty_bg_url?: string | null
          created_at?: string
          dark_marble_bg_url?: string | null
          hero_cta_text?: string | null
          hero_grid_images?: Json
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          marble_bg_url?: string | null
          primary_hex?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
