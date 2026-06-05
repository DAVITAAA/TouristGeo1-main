import React from 'react';
import { Language, translations } from '../translations';

interface FooterProps {
  language: Language;
  onNavigate?: (page: string, data?: any) => void;
}

export default function Footer({ language, onNavigate }: FooterProps) {
  const isKa = language === 'ka';
  const t = translations[language];

  return (
    <footer className="bg-white border-t border-border-light pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-5 cursor-pointer" onClick={() => onNavigate?.('home')}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-content shadow-md shadow-primary/15">
                <span className="material-symbols-outlined font-bold text-[20px]">terrain</span>
              </div>
              <span className="text-[19px] font-extrabold tracking-tight text-text-main font-display">
                {isKa ? 'მოგზაურობა' : 'Travel'}<span className="text-primary">{isKa ? 'საქართველოში' : 'Georgia'}</span>
              </span>
            </div>
            <p className="text-text-muted text-[13px] leading-relaxed max-w-sm">
              {isKa 
                ? 'საქართველოს საუკეთესო ტურისტული პლატფორმა. აღმოაჩინე შენი შემდეგი თავგადასავალი ჩვენთან ერთად.' 
                : 'The premier tourism platform for Georgia. Discover your next adventure with us.'}
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-text-main mb-5 uppercase tracking-widest">{isKa ? 'კომპანია' : 'Company'}</h3>
            <ul className="space-y-3.5 text-[13px] font-medium text-text-muted">
              <li><button onClick={() => onNavigate?.('why-georgia')} className="hover:text-primary transition-colors">{t.nav_why_georgia}</button></li>
              <li><button onClick={() => onNavigate?.('places')} className="hover:text-primary transition-colors">{t.nav_places}</button></li>
              <li><button className="hover:text-primary transition-colors cursor-not-allowed opacity-70">{isKa ? 'ბლოგი' : 'Blog'}</button></li>
              <li><button className="hover:text-primary transition-colors cursor-not-allowed opacity-70">{t.contact}</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-text-main mb-5 uppercase tracking-widest">{isKa ? 'დახმარება' : 'Support'}</h3>
            <ul className="space-y-3.5 text-[13px] font-medium text-text-muted">
              <li><button className="hover:text-primary transition-colors cursor-not-allowed opacity-70">{isKa ? 'ხშირად დასმული კითხვები' : 'FAQ'}</button></li>
              <li><button className="hover:text-primary transition-colors cursor-not-allowed opacity-70">{isKa ? 'უსაფრთხოება' : 'Safety'}</button></li>
              <li><button className="hover:text-primary transition-colors cursor-not-allowed opacity-70">{isKa ? 'წესები და პირობები' : 'Terms & Conditions'}</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-text-main mb-5 uppercase tracking-widest">{isKa ? 'გამოგვყევით' : 'Follow Us'}</h3>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 border border-border-light flex items-center justify-center text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 border border-border-light flex items-center justify-center text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.407-.06 4.123-.06h.08v.001zm0 2.162c-2.643 0-2.977.01-4.017.058-.954.044-1.462.206-1.814.343-.46.176-.79.386-1.15.746-.36.36-.57.691-.746 1.15-.137.352-.3.86-.343 1.814-.047 1.04-.058 1.374-.058 4.017s.01 2.977.058 4.017c.044.954.206 1.462.343 1.814.176.46.386.79.746 1.15.36.36.691.57 1.15.746.352.137.86.3 1.814.343 1.04.047 1.374.058 4.017.058s2.977-.01 4.017-.058c.954-.044 1.462-.206 1.814-.343.46-.176.79-.386 1.15-.746.36-.36.57-.691.746-1.15.137-.352.3-.86.343-1.814.047-1.04.058-1.374.058-4.017s-.01-2.977-.058-4.017c-.044-.954-.206-1.462-.343-1.814-.176-.46-.386-.79-.746-1.15-.36-.36-.691-.57-1.15-.746-.352-.137-.86-.3-1.814-.343-1.04-.047-1.374-.058-4.017-.058zm0 5.838a3.388 3.388 0 100 6.776 3.388 3.388 0 000-6.776zm5.338-3.205a1.284 1.284 0 110 2.568 1.284 1.284 0 010-2.568z" fillRule="evenodd"></path></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border-light pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
            {isKa ? '© 2024 Travel Georgia. ყველა უფლება დაცულია.' : '© 2024 Travel Georgia. All rights reserved.'}
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-text-muted uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">{isKa ? 'კონფიდენციალურობა' : 'Privacy'}</a>
            <a href="#" className="hover:text-primary transition-colors">{isKa ? 'წესები' : 'Terms'}</a>
            <a href="#" className="hover:text-primary transition-colors">{isKa ? 'საიტის რუკა' : 'Sitemap'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
