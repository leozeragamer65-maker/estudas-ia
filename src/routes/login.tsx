import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { phoneToEmail, normalizarTelefone, telefoneValido } from "@/lib/auth";
import { lookupTelefoneByGoogleEmail } from "@/lib/google-link.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — EstudaIA" },
      { name: "description", content: "Entra na tua conta EstudaIA com o teu número de telefone." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [identificador, setIdentificador] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const lookup = useServerFn(lookupTelefoneByGoogleEmail);

  const validarRegisto = () => {
    if (!telefoneValido(telefone)) {
      toast.error("Telefone inválido. Exemplo: 841234567");
      return false;
    }
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }
    return true;
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("Senha tem de ter pelo menos 6 caracteres.");
      return;
    }
    const id = identificador.trim();
    if (!id) {
      toast.error("Indica o teu telefone ou email Google.");
      return;
    }
    setLoading(true);
    let emailAuth: string | null = null;
    if (id.includes("@")) {
      try {
        const res = await lookup({ data: { email: id.toLowerCase() } });
        if (!res?.telefone) {
          setLoading(false);
          toast.error("Email Google não está associado a nenhuma conta.");
          return;
        }
        emailAuth = phoneToEmail(res.telefone);
      } catch {
        setLoading(false);
        toast.error("Falha ao validar email. Tenta novamente.");
        return;
      }
    } else {
      if (!telefoneValido(id)) {
        setLoading(false);
        toast.error("Telefone inválido.");
        return;
      }
      emailAuth = phoneToEmail(id);
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailAuth!,
      password: senha,
    });
    setLoading(false);
    if (error) {
      toast.error("Credenciais incorrectas.");
      return;
    }
    navigate({ to: "/app" });
  };

  const registar = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarRegisto()) return;
    if (nome.trim().length < 2) {
      toast.error("Diz-nos o teu nome.");
      return;
    }
    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(telefone),
      password: senha,
      options: {
        data: { telefone: normalizarTelefone(telefone), nome: nome.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already") ? "Este número já está registado." : error.message,
      );
      return;
    }
    toast.success("Bem-vindo ao EstudaIA! 🎓");
    navigate({ to: "/app" });
  };

  const entrarComGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/app",
      });
      if (result.error) {
        toast.error("Falha ao entrar com Google.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/app" });
    } catch {
      toast.error("Falha ao entrar com Google.");
      setLoading(false);
    }
  };




  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="font-display text-3xl text-primary">
            EstudaIA
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={entrar} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="ident">Telefone ou email Google</Label>
                  <Input
                    id="ident"
                    placeholder="841234567 ou nome@gmail.com"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pw1">Senha</Label>
                  <Input
                    id="pw1"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "A entrar…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={registar} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tel2">Telefone</Label>
                  <Input
                    id="tel2"
                    inputMode="tel"
                    placeholder="841234567"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pw2">Senha (mín. 6)</Label>
                  <Input
                    id="pw2"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pw2c">Confirmar senha</Label>
                  <Input
                    id="pw2c"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "A criar…" : "Criar conta grátis"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
