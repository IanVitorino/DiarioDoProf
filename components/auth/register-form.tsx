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
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createAccount } from "@/actions/auth";

const schema = z
  .object({
    nome: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }),
    password: z
      .string()
      .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
    confirmPassword: z.string().min(1, { message: "Confirme sua senha" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const RegisterForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: {
    nome: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    startTransition(async () => {
      const result = await createAccount(data);
      if (!result.ok) {
        setErrorMessage(result.error);
        setErrorOpen(true);
        return;
      }

      const signed = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signed?.ok) {
        toast.success("Conta criada com sucesso");
        window.location.assign("/");
      } else {
        toast.success("Conta criada — entre manualmente");
        window.location.assign("/login");
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Criar conta</h1>
        <p className="text-sm text-blue-100/80">
          Comece a organizar suas turmas em minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label
            htmlFor="nome"
            className="mb-2 block text-xs font-semibold text-blue-100/90 uppercase tracking-wider"
          >
            Nome
          </Label>
          <Input
            disabled={isPending}
            {...register("nome")}
            type="text"
            id="nome"
            placeholder="Seu nome"
            className={cn(
              "h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/15 transition",
              { "border-red-300 ring-1 ring-red-300": errors.nome }
            )}
          />
          {errors.nome && (
            <p className="text-red-200 text-xs mt-1.5">
              {errors.nome.message}
            </p>
          )}
        </div>

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

        <div>
          <Label
            htmlFor="confirmPassword"
            className="mb-2 block text-xs font-semibold text-blue-100/90 uppercase tracking-wider"
          >
            Confirmar senha
          </Label>
          <div className="relative">
            <Input
              disabled={isPending}
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              placeholder="••••••••"
              className={cn(
                "h-11 pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/15 transition",
                { "border-red-300 ring-1 ring-red-300": errors.confirmPassword }
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-200 text-xs mt-1.5">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 mt-3 bg-[#115e59] hover:bg-[#134e4a] text-white font-semibold tracking-widest uppercase rounded-md"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-blue-100/80">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-white font-semibold hover:underline"
        >
          Entrar
        </Link>
      </div>

      {/* Modal de erro de criação */}
      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="rounded-full bg-red-100 dark:bg-red-500/15 p-4 mb-4">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl text-default-900">
                Não foi possível criar a conta
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-default-600 max-w-xs">
                {errorMessage || "Tente novamente em alguns instantes."}
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

export default RegisterForm;
