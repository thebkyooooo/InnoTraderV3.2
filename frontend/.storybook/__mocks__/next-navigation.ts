export const usePathname = () => '/'
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
})
export const useSearchParams = () => new URLSearchParams()
export const useParams = () => ({})
export const redirect = (url: string) => { window.location.href = url }
