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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_manage_delivery: boolean
          can_manage_orders: boolean
          can_manage_products: boolean
          can_manage_users: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_delivery?: boolean
          can_manage_orders?: boolean
          can_manage_products?: boolean
          can_manage_users?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_delivery?: boolean
          can_manage_orders?: boolean
          can_manage_products?: boolean
          can_manage_users?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          google_maps_url: string | null
          id: string
          is_default: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          id?: string
          is_default?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          google_maps_url?: string | null
          id?: string
          is_default?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_en: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
        }
        Relationships: []
      }
      favorite_products: {
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
            foreignKeyName: "favorite_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_suppliers: {
        Row: {
          created_at: string
          id: string
          supplier_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplier_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplier_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_approval_requests: {
        Row: {
          approved_by: string | null
          branch_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          requested_by: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          requested_by: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          requested_by?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_approval_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_approval_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          delivery_fee: number | null
          id: string
          invoice_url: string | null
          order_id: string
          product_id: string
          quantity: number
          status: string
          supplier_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          invoice_url?: string | null
          order_id: string
          product_id: string
          quantity?: number
          status?: string
          supplier_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          invoice_url?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          status?: string
          supplier_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          created_at: string
          id: string
          is_paid: boolean
          order_id: string | null
          receipt_url: string | null
          restaurant_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid?: boolean
          order_id?: string | null
          receipt_url?: string | null
          restaurant_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_paid?: boolean
          order_id?: string | null
          receipt_url?: string | null
          restaurant_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_template_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "order_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      order_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          branch_id: string | null
          created_at: string
          delivery_address: string | null
          delivery_fee: number
          id: string
          is_pickup: boolean | null
          notes: string | null
          restaurant_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          is_pickup?: boolean | null
          notes?: string | null
          restaurant_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          is_pickup?: boolean | null
          notes?: string | null
          restaurant_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_custom_prices: {
        Row: {
          created_at: string
          custom_price: number
          id: string
          product_id: string
          restaurant_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_price: number
          id?: string
          product_id: string
          restaurant_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_price?: number
          id?: string
          product_id?: string
          restaurant_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_custom_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_tiers: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          price_per_unit: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity: number
          price_per_unit: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          price_per_unit?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          country_of_origin: string | null
          created_at: string
          delivery_fee: number | null
          description: string | null
          description_en: string | null
          description_hi: string | null
          description_ur: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          name_en: string | null
          name_hi: string | null
          name_ur: string | null
          price: number
          section_id: string | null
          sku: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          supplier_id: string
          unit: string
          unlimited_stock: boolean | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          country_of_origin?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          description_en?: string | null
          description_hi?: string | null
          description_ur?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          name_en?: string | null
          name_hi?: string | null
          name_ur?: string | null
          price: number
          section_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_id: string
          unit?: string
          unlimited_stock?: boolean | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          country_of_origin?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          description_en?: string | null
          description_hi?: string | null
          description_ur?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          name_en?: string | null
          name_hi?: string | null
          name_ur?: string | null
          price?: number
          section_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_id?: string
          unit?: string
          unlimited_stock?: boolean | null
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
          {
            foreignKeyName: "products_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_name: string | null
          bank_iban: string | null
          bank_name: string | null
          bio: string | null
          business_name: string
          business_name_en: string | null
          city: string | null
          commercial_registration_url: string | null
          created_at: string
          customer_code: string | null
          default_delivery_fee: number | null
          delivery_option: string | null
          full_name: string
          google_maps_url: string | null
          id: string
          is_approved: boolean
          license_url: string | null
          minimum_order_amount: number | null
          national_address_url: string | null
          phone: string | null
          region: string | null
          service_cities: string[] | null
          service_regions: string[] | null
          supply_categories: string[] | null
          tax_certificate_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name: string
          business_name_en?: string | null
          city?: string | null
          commercial_registration_url?: string | null
          created_at?: string
          customer_code?: string | null
          default_delivery_fee?: number | null
          delivery_option?: string | null
          full_name: string
          google_maps_url?: string | null
          id?: string
          is_approved?: boolean
          license_url?: string | null
          minimum_order_amount?: number | null
          national_address_url?: string | null
          phone?: string | null
          region?: string | null
          service_cities?: string[] | null
          service_regions?: string[] | null
          supply_categories?: string[] | null
          tax_certificate_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string
          business_name_en?: string | null
          city?: string | null
          commercial_registration_url?: string | null
          created_at?: string
          customer_code?: string | null
          default_delivery_fee?: number | null
          delivery_option?: string | null
          full_name?: string
          google_maps_url?: string | null
          id?: string
          is_approved?: boolean
          license_url?: string | null
          minimum_order_amount?: number | null
          national_address_url?: string | null
          phone?: string | null
          region?: string | null
          service_cities?: string[] | null
          service_regions?: string[] | null
          supply_categories?: string[] | null
          tax_certificate_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_features: {
        Row: {
          can_manage_sub_users: boolean | null
          can_order: boolean
          can_repeat_orders: boolean
          can_use_branches: boolean
          can_use_custom_prices: boolean
          can_use_favorites: boolean
          can_use_templates: boolean
          can_view_analytics: boolean
          created_at: string
          id: string
          is_active: boolean
          max_branches: number | null
          max_notes_chars: number | null
          max_orders_per_month: number | null
          max_sub_users: number | null
          notes: string | null
          plan_id: string | null
          restaurant_id: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_type: string | null
          updated_at: string
        }
        Insert: {
          can_manage_sub_users?: boolean | null
          can_order?: boolean
          can_repeat_orders?: boolean
          can_use_branches?: boolean
          can_use_custom_prices?: boolean
          can_use_favorites?: boolean
          can_use_templates?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_notes_chars?: number | null
          max_orders_per_month?: number | null
          max_sub_users?: number | null
          notes?: string | null
          plan_id?: string | null
          restaurant_id: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Update: {
          can_manage_sub_users?: boolean | null
          can_order?: boolean
          can_repeat_orders?: boolean
          can_use_branches?: boolean
          can_use_custom_prices?: boolean
          can_use_favorites?: boolean
          can_use_templates?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_notes_chars?: number | null
          max_orders_per_month?: number | null
          max_sub_users?: number | null
          notes?: string | null
          plan_id?: string | null
          restaurant_id?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_sub_user_branches: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          sub_user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          sub_user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          sub_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_sub_user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_sub_user_branches_sub_user_id_fkey"
            columns: ["sub_user_id"]
            isOneToOne: false
            referencedRelation: "restaurant_sub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_sub_user_permissions: {
        Row: {
          can_approve_order: boolean | null
          can_cancel_order: boolean | null
          can_edit_order: boolean | null
          can_see_favorite_products_only: boolean | null
          can_see_favorite_suppliers_only: boolean | null
          can_see_order_totals: boolean | null
          can_see_prices: boolean | null
          created_at: string | null
          id: string
          sub_user_id: string
          updated_at: string | null
        }
        Insert: {
          can_approve_order?: boolean | null
          can_cancel_order?: boolean | null
          can_edit_order?: boolean | null
          can_see_favorite_products_only?: boolean | null
          can_see_favorite_suppliers_only?: boolean | null
          can_see_order_totals?: boolean | null
          can_see_prices?: boolean | null
          created_at?: string | null
          id?: string
          sub_user_id: string
          updated_at?: string | null
        }
        Update: {
          can_approve_order?: boolean | null
          can_cancel_order?: boolean | null
          can_edit_order?: boolean | null
          can_see_favorite_products_only?: boolean | null
          can_see_favorite_suppliers_only?: boolean | null
          can_see_order_totals?: boolean | null
          can_see_prices?: boolean | null
          created_at?: string | null
          id?: string
          sub_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_sub_user_permissions_sub_user_id_fkey"
            columns: ["sub_user_id"]
            isOneToOne: true
            referencedRelation: "restaurant_sub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_sub_users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          restaurant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          restaurant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          restaurant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_en: string | null
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
          subcategory_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          icon: string | null
          id: string
          name: string
          name_en: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          can_manage_sub_users: boolean
          can_order: boolean
          can_repeat_orders: boolean
          can_use_branches: boolean
          can_use_custom_prices: boolean
          can_use_favorites: boolean
          can_use_templates: boolean
          can_view_analytics: boolean
          created_at: string
          description: string | null
          duration_months: number
          id: string
          is_active: boolean
          max_branches: number | null
          max_notes_chars: number | null
          max_orders_per_month: number | null
          max_sub_users: number | null
          name: string
          name_en: string | null
          price: number
          updated_at: string
        }
        Insert: {
          can_manage_sub_users?: boolean
          can_order?: boolean
          can_repeat_orders?: boolean
          can_use_branches?: boolean
          can_use_custom_prices?: boolean
          can_use_favorites?: boolean
          can_use_templates?: boolean
          can_view_analytics?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_notes_chars?: number | null
          max_orders_per_month?: number | null
          max_sub_users?: number | null
          name: string
          name_en?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          can_manage_sub_users?: boolean
          can_order?: boolean
          can_repeat_orders?: boolean
          can_use_branches?: boolean
          can_use_custom_prices?: boolean
          can_use_favorites?: boolean
          can_use_templates?: boolean
          can_view_analytics?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_notes_chars?: number | null
          max_orders_per_month?: number | null
          max_sub_users?: number | null
          name?: string
          name_en?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_renewals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          receipt_url: string | null
          restaurant_id: string
          status: string
          subscription_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          restaurant_id: string
          status?: string
          subscription_type?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          restaurant_id?: string
          status?: string
          subscription_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_en: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_restaurants: {
        Args: never
        Returns: {
          business_name: string
          created_at: string
          customer_code: string
          full_name: string
          user_id: string
        }[]
      }
      get_approved_suppliers: {
        Args: never
        Returns: {
          business_name: string
          created_at: string
          customer_code: string
          full_name: string
          user_id: string
        }[]
      }
      get_order_restaurant_id: { Args: { _order_id: string }; Returns: string }
      get_restaurant_owner_id: { Args: { _user_id: string }; Returns: string }
      get_restaurant_profile_for_order: {
        Args: { _restaurant_id: string }
        Returns: {
          business_name: string
          customer_code: string
          full_name: string
          google_maps_url: string
          phone: string
          user_id: string
        }[]
      }
      get_sub_user_branches: {
        Args: { _user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      get_sub_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_approve_order: boolean
          can_cancel_order: boolean
          can_edit_order: boolean
          can_see_favorite_products_only: boolean
          can_see_favorite_suppliers_only: boolean
          can_see_order_totals: boolean
          can_see_prices: boolean
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_sub_user: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      restaurant_has_feature: {
        Args: { _feature: string; _restaurant_id: string }
        Returns: boolean
      }
      supplier_has_order_items: {
        Args: { _order_id: string; _supplier_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "restaurant" | "supplier"
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
      app_role: ["admin", "restaurant", "supplier"],
    },
  },
} as const
