import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail, normalizarTelefone, telefoneValido } from "@/lib/auth";

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
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const validar = () => {
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
    if (!validar()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(telefone),
      password: senha,
    });
    setLoading(false);
    if (error) {
      toast.error("Número ou senha incorrectos.");
      return;
    }
    navigate({ to: "/app" });
  };

  const registar = async (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
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
                  <Label htmlFor="tel1">Telefone</Label>
                  <Input
                    id="tel1"
                    inputMode="tel"
                    placeholder="841234567"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
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
