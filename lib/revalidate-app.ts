import { revalidatePath } from 'next/cache'

/** Invalida rutas que dependen de sesión / perfil tras cambios de auth. */
export function revalidateAfterAuthChange() {
  revalidatePath('/')
  revalidatePath('/login')
  revalidatePath('/pronosticos')
  revalidatePath('/tabla')
  revalidatePath('/en-vivo')
  revalidatePath('/concluidos')
  revalidatePath('/aciertos')
}
