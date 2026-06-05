import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { useScrollReveal } from '../hooks/useScrollReveal';

const faqsEn = [
    { q: "How do I book a tour?", a: "You can easily book a tour by navigating to the tour details page, selecting your date and the number of guests, and clicking the 'Book This Tour' button." },
    { q: "What is your cancellation policy?", a: "Most of our tours offer a full refund if canceled at least 24 hours in advance. Please check the specific cancellation policy on each tour's detail page." },
    { q: "Are the tours guided?", a: "Yes, all our scheduled tours are led by professional, certified local guides who are experts in their fields." },
    { q: "Can I customize a tour?", a: "Absolutely! For customized or private tours, please contact us directly through the chat or contact options provided on the website." },
    { q: "What languages are the tours conducted in?", a: "Our guides speak English, Georgian, Russian, and on specific tours, other languages like German or Turkish. Language options are listed on the tour page." }
];

const faqsKa = [
    { q: "როგორ დავჯავშნო ტური?", a: "ტურის დაჯავშნა მარტივია: აირჩიეთ სასურველი ტური, მიუთითეთ თარიღი და სტუმრების რაოდენობა, შემდეგ კი დააჭირეთ ჯავშნის ღილაკს." },
    { q: "რა არის გაუქმების პოლიტიკა?", a: "ტურების უმეტესობაზე მოქმედებს 24 საათიანი უფასო გაუქმება სრული თანხის დაბრუნებით. კონკრეტული პირობები შეგიძლიათ იხილოთ ტურის გვერდზე." },
    { q: "ტურები გიდით ტარდება?", a: "დიახ, ყველა ჩვენს გეგმიურ ტურს უძღვებიან სერტიფიცირებული, პროფესიონალი ადგილობრივი გიდები." },
    { q: "შესაძლებელია ინდივიდუალური ტურის დაგეგმვა?", a: "რა თქმა უნდა! პერსონალური ტურებისთვის დაგვიკავშირდით პირდაპირ ჩატის ან საკონტაქტო ფორმის საშუალებით." },
    { q: "რა ენებზე ტარდება ტურები?", a: "ტურები ტარდება ქართულ, ინგლისურ და რუსულ ენებზე. ზოგიერთ ტურზე ხელმისაწვდომია სხვა ენებიც (მაგ. გერმანული, თურქული)." }
];

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, isVisible } = useScrollReveal();
    return (
        <div ref={ref} className={`scroll-reveal ${isVisible ? 'visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
            {children}
        </div>
    );
}

export default function FAQ({ language }: { language: Language }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const isKa = language === 'ka';
    const faqs = isKa ? faqsKa : faqsEn;

    return (
        <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }} className="bg-background-light">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <ScrollReveal>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-main leading-tight mb-4 font-display">
                            {isKa ? 'ხშირად დასმული კითხვები' : 'Frequently Asked Questions'}
                        </h2>
                        <p className="text-text-muted text-[15px] font-medium max-w-xl mx-auto">
                            {isKa ? 'გაიგეთ მეტი ჩვენი სერვისების, პოლიტიკისა და ტურების შესახებ.' : 'Find out more about our services, policies, and tours.'}
                        </p>
                    </div>
                </ScrollReveal>

                <div className="space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <ScrollReveal key={index} delay={index * 0.05}>
                                <div
                                    className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${isOpen ? 'border-primary/30 shadow-sm' : 'border-border-light hover:border-gray-300'}`}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                                    >
                                        <span className={`font-bold text-[15px] ${isOpen ? 'text-primary' : 'text-text-main'}`}>
                                            {faq.q}
                                        </span>
                                        <span
                                            className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-text-muted'}`}
                                        >
                                            expand_more
                                        </span>
                                    </button>
                                    <div
                                        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <p className="text-text-muted leading-relaxed text-[14px]">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
