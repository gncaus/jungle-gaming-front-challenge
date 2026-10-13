import { ImageIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { avatarAccept, toAvatarDataUrl } from '@/features/profile/avatar-image'
import { useRemoveAvatar, useUploadAvatar } from '@/features/profile/hooks/use-profile'
import { announce } from '@/shared/lib/announce'
import { HttpError } from '@/shared/lib/http'
import { Button } from '@/shared/ui/button'

function messageOf(error: unknown): string {
  if (error instanceof HttpError) return error.fields?.dataUrl ?? error.message
  return error instanceof Error ? error.message : 'Não foi possível atualizar o avatar.'
}

/** Avatar do colecionador: troca e remoção são gravadas na hora, sem depender do "Salvar". */
export function AvatarField({ avatarUrl }: { avatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Permite escolher o mesmo arquivo de novo depois de um erro.
    event.target.value = ''
    if (!file) return

    setError(null)
    try {
      const dataUrl = await toAvatarDataUrl(file)
      await upload.mutateAsync({ dataUrl })
      announce('Avatar atualizado.')
    } catch (failure) {
      setError(messageOf(failure))
    }
  }

  function clear() {
    setError(null)
    remove.mutate(undefined, {
      onSuccess: () => announce('Avatar removido.'),
      onError: (failure) => setError(messageOf(failure)),
    })
  }

  return (
    <div role="group" aria-labelledby="avatar-label">
      <p id="avatar-label" className="mb-2 text-sm">
        Avatar
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <span className="bg-card text-brand-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar atual" width={48} height={48} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5" aria-hidden="true" />
          )}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={avatarAccept}
          onChange={(event) => void choose(event)}
          aria-label="Arquivo do avatar"
          className="sr-only"
          tabIndex={-1}
        />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <Button type="button" variant="ghost" onClick={clear} disabled={busy || !avatarUrl}>
          {remove.isPending ? 'Removendo…' : 'Remover'}
        </Button>
      </div>
      <p role="alert" className="text-text-coral mt-1.5 text-xs empty:hidden">
        {error}
      </p>
    </div>
  )
}
