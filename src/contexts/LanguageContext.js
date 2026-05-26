import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('rehabline_language');

  if (savedLanguage === 'UA' || savedLanguage === 'EN') {
    return savedLanguage;
  }

  return 'UA';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('rehabline_language', lang);
    document.documentElement.lang = lang === 'UA' ? 'uk' : 'en';
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'UA' ? 'EN' : 'UA'));
  };

  const setLanguage = (nextLang) => {
    if (nextLang === 'UA' || nextLang === 'EN') {
      setLang(nextLang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};