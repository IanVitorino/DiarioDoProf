"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
});

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: { email: string; password: string }) => {
    startTransition(async () => {
      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (response?.ok) {
        reset();
        setSuccessOpen(true);
        setTimeout(() => {
          window.location.assign("/");
        }, 1400);
      } else {
        setErrorOpen(true);
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Bem-vindo!</h1>
        <p className="text-sm text-blue-100/80">
          Entre com seu email e senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label
            htmlFor="email"
            className="mb-2 block text-xs font-semibold text-blue-100/90 uppercase tracking-wider"
          >
            Email
          </Label>
          <Input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            placeholder="seu@email.com"
            className={cn(
              "h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/15 transition",
              { "border-red-300 ring-1 ring-red-300": errors.email }
            )}
          />
          {errors.email && (
            <p className="text-red-200 text-xs mt-1.5">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="password"
            className="mb-2 block text-xs font-semibold text-blue-100/90 uppercase tracking-wider"
          >
            Senha
          </Label>
          <div className="relative">
            <Input
              disabled={isPending}
              {...register("password")}
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="••••••••"
              className={cn(
                "h-11 pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/15 transition",
                { "border-red-300 ring-1 ring-red-300": errors.password }
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-200 text-xs mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 mt-3 bg-[#115e59] hover:bg-[#134e4a] text-white font-semibold tracking-widest uppercase rounded-md"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-blue-100/80">
        Não tem conta?{" "}
        <Link
          href="/signup"
          className="text-white font-semibold hover:underline"
        >
          Criar conta
        </Link>
      </div>

      {/* Modal de login bem-sucedido */}
      <AlertDialog open={successOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative rounded-full bg-emerald-100 dark:bg-emerald-500/15 p-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <AlertDialogTitle className="text-xl text-default-900">
                Login realizado!
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-default-600 max-w-xs flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Redirecionando para o painel...
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de erro de credenciais */}
      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="rounded-full bg-red-100 dark:bg-red-500/15 p-4 mb-4">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl text-default-900">
                Não foi possível entrar
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-default-600 max-w-xs">
                Email ou senha incorretos. Verifique suas credenciais e tente
                novamente.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-2">
            <AlertDialogAction
              onClick={() => setErrorOpen(false)}
              className="w-full bg-[#0f766e] hover:bg-[#115e59] text-white"
            >
              Tentar novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LogInForm;
