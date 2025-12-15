import { z } from 'zod'

/**
 * Schema de validação para Cliente
 */
export const ClientSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  phone: z.string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX')
    .or(z.literal(''))
    .optional()
})

/**
 * Schema de validação para Perfil Metalon
 */
export const ProfileSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  espessura: z.string()
    .max(20, 'Espessura deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  custo_por_metro: z.number()
    .positive('Custo deve ser positivo')
    .max(10000, 'Valor muito alto')
})

/**
 * Schema de validação para Configuração
 */
export const ConfigurationSchema = z.object({
  valor_por_corte: z.number()
    .nonnegative('Valor não pode ser negativo')
    .max(1000, 'Valor muito alto'),
  valor_por_solda: z.number()
    .nonnegative('Valor não pode ser negativo')
    .max(1000, 'Valor muito alto'),
  valor_por_km: z.number()
    .nonnegative('Valor não pode ser negativo')
    .max(100, 'Valor muito alto'),
  percentual_pintura_default: z.number()
    .min(0, 'Percentual não pode ser negativo')
    .max(100, 'Percentual deve estar entre 0 e 100'),
  validade_padrao: z.number()
    .int('Validade deve ser um número inteiro')
    .positive('Validade deve ser positiva')
    .max(365, 'Validade muito alta')
})

/**
 * Schema de validação para Item de Orçamento
 */
export const QuoteItemSchema = z.object({
  profile_id: z.string().uuid('ID do perfil inválido'),
  quantidade: z.number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser positiva')
    .max(1000, 'Quantidade muito alta'),
  metros_por_barra: z.number()
    .positive('Metros por barra deve ser positivo')
    .max(100, 'Valor muito alto'),
  pintura: z.boolean(),
  cortes_extras: z.number()
    .int('Cortes extras deve ser um número inteiro')
    .nonnegative('Cortes extras não pode ser negativo')
    .max(100, 'Valor muito alto'),
  soldas_extras: z.number()
    .int('Soldas extras deve ser um número inteiro')
    .nonnegative('Soldas extras não pode ser negativo')
    .max(100, 'Valor muito alto')
})

/**
 * Schema de validação para Produto Genérico
 */
export const GenericProductSchema = z.object({
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  quantidade: z.number()
    .positive('Quantidade deve ser positiva')
    .max(10000, 'Quantidade muito alta'),
  valor_unitario: z.number()
    .positive('Valor unitário deve ser positivo')
    .max(1000000, 'Valor muito alto')
})

/**
 * Schema de validação para Markup (Pontuação)
 */
export const MarkupSchema = z.object({
  label: z.string()
    .min(1, 'Label é obrigatório')
    .max(50, 'Label deve ter no máximo 50 caracteres'),
  value: z.number()
    .positive('Valor deve ser positivo')
    .min(1, 'Valor mínimo é 1')
    .max(10, 'Valor máximo é 10')
})

/**
 * Schema de validação para Orçamento
 */
export const QuoteSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  pontuacao_aplicada: z.number()
    .min(1, 'Pontuação mínima é 1')
    .max(10, 'Pontuação máxima é 10'),
  km_rodado: z.number()
    .nonnegative('KM não pode ser negativo')
    .max(1000, 'KM muito alto'),
  validade_dias: z.number()
    .int('Validade deve ser um número inteiro')
    .positive('Validade deve ser positiva')
    .max(365, 'Validade muito alta'),
  observacoes: z.string()
    .max(5000, 'Observações muito longas')
})

export type ClientInput = z.infer<typeof ClientSchema>
export type ProfileInput = z.infer<typeof ProfileSchema>
export type ConfigurationInput = z.infer<typeof ConfigurationSchema>
export type MarkupInput = z.infer<typeof MarkupSchema>
export type QuoteItemInput = z.infer<typeof QuoteItemSchema>
export type GenericProductInput = z.infer<typeof GenericProductSchema>
export type QuoteInput = z.infer<typeof QuoteSchema>
