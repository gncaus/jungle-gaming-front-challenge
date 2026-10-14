import { networkIds } from '@/features/catalog/schemas'
import { useWalletForm, type WalletFormApi } from '@/features/wallets/hooks/use-wallet-form'
import { useSaveWallet } from '@/features/wallets/hooks/use-wallets'
import { networkNames } from '@/features/catalog/labels'
import { providerNames } from '@/features/wallets/labels'
import { walletProviders, type Wallet, type WalletInput, type WalletSlot } from '@/features/wallets/schemas'
import { announce } from '@/shared/lib/announce'
import { applyApiError } from '@/shared/lib/form-errors'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SelectField } from '@/shared/ui/select-field'
import { TextField } from '@/shared/ui/text-field'

const networkOptions = networkIds.map((id) => ({ value: id, label: networkNames[id] }))
const providerOptions = walletProviders.map((id) => ({ value: id, label: providerNames[id] }))

/** Os campos da carteira, na ordem do layout. Quem usa decide como e quando salvar. */
export function WalletFields({ form, className }: { form: WalletFormApi; className?: string }) {
  const { errors } = form.formState

  return (
    <div className={cn('grid gap-x-6 gap-y-4 md:grid-cols-2', className)}>
      <p role="alert" className="text-text-coral text-sm empty:hidden md:col-span-2">
        {errors.root?.message}
      </p>
      <TextField
        label="Nome de exibição"
        required
        autoComplete="name"
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
      <TextField
        label="Apelido da carteira"
        required
        autoComplete="off"
        error={errors.nickname?.message}
        {...form.register('nickname')}
      />
      <SelectField
        label="Rede"
        required
        placeholder="Selecione uma rede"
        options={networkOptions}
        error={errors.network?.message}
        {...form.register('network')}
      />
      <TextField
        label="Nome do perfil"
        required
        autoComplete="off"
        error={errors.profileName?.message}
        {...form.register('profileName')}
      />
      <TextField
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        autoComplete="off"
        spellCheck={false}
        error={errors.address?.message}
        {...form.register('address')}
      />
      <TextField
        label="ENS ou carteira secundária"
        placeholder="ENS ou carteira secundária (opcional)"
        autoComplete="off"
        spellCheck={false}
        error={errors.secondaryAddress?.message}
        {...form.register('secondaryAddress')}
      />
      <SelectField
        label="Tipo de carteira"
        required
        placeholder="Selecione uma carteira"
        options={providerOptions}
        error={errors.provider?.message}
        {...form.register('provider')}
      />
      <TextField
        label="Código de indicação"
        required
        autoComplete="off"
        error={errors.referralCode?.message}
        {...form.register('referralCode')}
      />
      <TextField
        label="E-mail"
        required
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Nome ENS"
        labelHint="(sem o .eth)"
        adornment=".eth"
        required
        autoComplete="off"
        spellCheck={false}
        error={errors.ensName?.message}
        {...form.register('ensName')}
      />
    </div>
  )
}

interface WalletFormProps {
  slot: WalletSlot
  /** Carteira já cadastrada neste lugar, ou `null` para cadastrar. */
  wallet: Wallet | null
  /** Valores sugeridos para um cadastro novo (ex.: nome e e-mail do perfil). */
  suggestions?: Partial<WalletInput>
  onSaved?: () => void
}

/** Cadastro e edição de carteira com o próprio botão de salvar, usado na tela de Carteiras. */
export function WalletForm({ slot, wallet, suggestions, onSaved }: WalletFormProps) {
  const save = useSaveWallet()
  const form = useWalletForm(wallet, suggestions)

  const submit = form.handleSubmit((input) => {
    if (save.isPending) return
    save.mutate(
      { slot, input },
      {
        onSuccess: () => {
          announce('Carteira salva.')
          onSaved?.()
        },
        onError: (error) => applyApiError(form, error),
      },
    )
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <WalletFields form={form} />
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}
