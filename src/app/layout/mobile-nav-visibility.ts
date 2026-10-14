/**
 * Telas cujo frame mobile não tem a barra de navegação inferior: elas têm o botão de voltar
 * no topo e a ação principal no rodapé.
 */
const pathsWithoutMobileNav = ['/nft/', '/carrinho', '/pagamento']

export function hasMobileNav(pathname: string): boolean {
  return !pathsWithoutMobileNav.some((prefix) => pathname.startsWith(prefix))
}
