"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SiteLogo } from "@/components/svg";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "@/hooks/use-media-query";

const schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
});

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = React.useState("password");
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");

  const togglePasswordType = () => {
    setPasswordType((p) => (p === "password" ? "text" : "password"));
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: { email: string; password: string }) => {
    startTransition(async () => {
      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (response?.ok) {
        toast.success("Login realizado");
        window.location.assign("/");
        reset();
      } else {
        toast.error("Email ou senha incorretos");
      }
    });
  };

  return (
    <div className="w-full py-10">
      <div className="flex justify-center">
        <SiteLogo variant="full" className="h-48 w-auto" />
      </div>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900 text-center">
        Bem-vindo de volta 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 2xl:mt-2 leading-6 text-center">
        Entre com seu email e senha.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7">
        <div>
          <Label htmlFor="email" className="mb-2 font-medium text-default-600">
            Email
          </Label>
          <Input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            className={cn("", { "border-destructive": errors.email })}
            size={!isDesktop2xl ? "xl" : "lg"}
          />
        </div>
        {errors.email && (
          <div className="text-destructive mt-2">{errors.email.message}</div>
        )}

        <div className="mt-3.5">
          <Label htmlFor="password" className="mb-2 font-medium text-default-600">
            Senha
          </Label>
          <div className="relative">
            <Input
              disabled={isPending}
              {...register("password")}
              type={passwordType}
              id="password"
              className="peer"
              size={!isDesktop2xl ? "xl" : "lg"}
              placeholder=" "
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
              onClick={togglePasswordType}
            >
              <Icon
                icon={passwordType === "password" ? "heroicons:eye" : "heroicons:eye-slash"}
                className="w-5 h-5 text-default-400"
              />
            </div>
          </div>
        </div>
        {errors.password && (
          <div className="text-destructive mt-2">{errors.password.message}</div>
        )}

        <Button
          className="w-full mt-8"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <div className="mt-5 2xl:mt-8 text-center text-base text-default-600">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="text-primary">
          Criar conta
        </Link>
      </div>
    </div>
  );
};

export default LogInForm;
