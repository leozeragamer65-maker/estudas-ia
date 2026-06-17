export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          comentario: string;
          created_at: string;
          estrelas: number;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comentario?: string;
          created_at?: string;
          estrelas: number;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comentario?: string;
          created_at?: string;
          estrelas?: number;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          created_at: string;
          id: string;
          seccao: string;
          titulo: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          seccao?: string;
          titulo?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          seccao?: string;
          titulo?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      contatos_admin: {
        Row: {
          categoria: string;
          created_at: string;
          id: string;
          mensagem: string;
          motivo: string;
          status: string;
          telefone: string;
          user_id: string;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          id?: string;
          mensagem?: string;
          motivo: string;
          status?: string;
          telefone: string;
          user_id: string;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          id?: string;
          mensagem?: string;
          motivo?: string;
          status?: string;
          telefone?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      mensagens: {
        Row: {
          chat_id: string;
          conteudo: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          conteudo: string;
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          conteudo?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          corpo: string;
          created_at: string;
          id: string;
          lida: boolean;
          titulo: string;
          user_id: string;
        };
        Insert: {
          corpo?: string;
          created_at?: string;
          id?: string;
          lida?: boolean;
          titulo: string;
          user_id: string;
        };
        Update: {
          corpo?: string;
          created_at?: string;
          id?: string;
          lida?: boolean;
          titulo?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          google_email: string | null;
          id: string;
          nome: string;
          plano: string;
          plano_expira: string | null;
          telefone: string;
          trabalhos_disponiveis: number;
        };
        Insert: {
          created_at?: string;
          google_email?: string | null;
          id: string;
          nome?: string;
          plano?: string;
          plano_expira?: string | null;
          telefone: string;
          trabalhos_disponiveis?: number;
        };
        Update: {
          created_at?: string;
          google_email?: string | null;
          id?: string;
          nome?: string;
          plano?: string;
          plano_expira?: string | null;
          telefone?: string;
          trabalhos_disponiveis?: number;
        };
        Relationships: [];
      };
      quiz_respostas: {
        Row: {
          correta: boolean;
          created_at: string;
          dia: string;
          id: string;
          quiz_id: string;
          resposta: number;
          user_id: string;
        };
        Insert: {
          correta: boolean;
          created_at?: string;
          dia?: string;
          id?: string;
          quiz_id: string;
          resposta: number;
          user_id: string;
        };
        Update: {
          correta?: boolean;
          created_at?: string;
          dia?: string;
          id?: string;
          quiz_id?: string;
          resposta?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_respostas_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          categoria: string;
          created_at: string;
          explicacao: string;
          id: string;
          opcoes: Json;
          pergunta: string;
          resposta_correta: number;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          explicacao?: string;
          id?: string;
          opcoes: Json;
          pergunta: string;
          resposta_correta: number;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          explicacao?: string;
          id?: string;
          opcoes?: Json;
          pergunta?: string;
          resposta_correta?: number;
        };
        Relationships: [];
      };
      trabalhos: {
        Row: {
          anexos: Json;
          chat_id: string | null;
          created_at: string;
          dados_formulario: Json;
          entregue_em: string | null;
          ficheiro_url: string | null;
          id: string;
          status: string;
          tipo_fonte: string;
          titulo: string | null;
          user_id: string;
        };
        Insert: {
          anexos?: Json;
          chat_id?: string | null;
          created_at?: string;
          dados_formulario?: Json;
          entregue_em?: string | null;
          ficheiro_url?: string | null;
          id?: string;
          status?: string;
          tipo_fonte?: string;
          titulo?: string | null;
          user_id: string;
        };
        Update: {
          anexos?: Json;
          chat_id?: string | null;
          created_at?: string;
          dados_formulario?: Json;
          entregue_em?: string | null;
          ficheiro_url?: string | null;
          id?: string;
          status?: string;
          tipo_fonte?: string;
          titulo?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trabalhos_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number | null;
          created_at: string;
          currency: string | null;
          id: string;
          product_id: string | null;
          provider: string;
          raw: Json | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          product_id?: string | null;
          provider: string;
          raw?: Json | null;
          status: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          product_id?: string | null;
          provider?: string;
          raw?: Json | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      usage_daily: {
        Row: {
          chat: number;
          dia: string;
          matematica: number;
          resumo: number;
          trabalhos: number;
          traducao: number;
          user_id: string;
        };
        Insert: {
          chat?: number;
          dia?: string;
          matematica?: number;
          resumo?: number;
          trabalhos?: number;
          traducao?: number;
          user_id: string;
        };
        Update: {
          chat?: number;
          dia?: string;
          matematica?: number;
          resumo?: number;
          trabalhos?: number;
          traducao?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      webhook_logs: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          payload: Json;
          processed: boolean;
          provider: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          payload: Json;
          processed?: boolean;
          provider: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          payload?: Json;
          processed?: boolean;
          provider?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
