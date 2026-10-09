import './style.css';
import SiteHeader from '@/components/SiteHeader';
export const metadata={title:'Лист — истории и ранобэ',description:'Читайте и публикуйте истории'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body><SiteHeader/>{children}<footer><div className="footer-inner"><strong>лист<span className="accent">.</span></strong><span>Истории и ранобэ</span><span>Ранняя версия</span></div></footer></body></html>}
