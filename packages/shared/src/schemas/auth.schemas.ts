import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export const RegisterSchema = z.object({
  orgName: z.string().min(2).max(100).trim(),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

export type LoginDto = z.infer<typeof LoginSchema>
export type RegisterDto = z.infer<typeof RegisterSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>
