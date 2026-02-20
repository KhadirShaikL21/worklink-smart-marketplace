import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronUp, Phone, MessageSquare, BookOpen, AlertCircle, CreditCard, User, Briefcase, Volume2, StopCircle } from 'lucide-react';

const iconMap = {
  User: <User className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  AlertCircle: <AlertCircle className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />
};

export default function HelpCenter() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePlay = (e, text, id) => {
    e.stopPropagation(); // Prevent toggling the item
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    
    // Map i18next language codes to browser speech synthesis codes
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN' // Try finding 'te-IN' specifically
    };
    
    const targetLang = langMap[i18n.resolvedLanguage] || 'en-US';
    utterance.lang = targetLang;
    
    // Try to find a voice matching the language for better quality
    let voices = window.speechSynthesis.getVoices();
    // Sometimes voices are empty on first load, try to refresh
    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
             voices = window.speechSynthesis.getVoices();
        };
    }
    
    // Improved voice selection logic for Telugu
    let voice = voices.find(v => v.lang === targetLang); // Exact match first (te-IN)
    
    // If no exact match, try ignoring region code (e.g. just 'te')
    if (!voice) {
        voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0])); 
    }

    // Special handling for Telugu on some systems where it might be listed differently
    if (!voice && targetLang === 'te-IN') {
         voice = voices.find(v => v.name.toLowerCase().includes('telugu'));
    }
    
    if (voice) {
        utterance.voice = voice;
    } else {
        console.warn(`No voice found for language: ${targetLang}. Using system default.`);
    }

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const categories = t('helpCenter.categories', { returnObjects: true }) || [];

  const filteredScenarios = categories.map(cat => ({
    ...cat,
    items: (cat.items || []).filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('helpCenter.title')}
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            {t('helpCenter.subtitle')}
          </p>
          <div className="mt-6 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
              placeholder={t('helpCenter.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredScenarios.map((category, catIndex) => (
            <div key={catIndex} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center">
                <div className="mr-3 p-2 bg-white rounded-full shadow-sm text-primary-600">
                  {iconMap[category.icon] || <BookOpen className="w-5 h-5" />}
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {category.title}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {category.items.map((item, itemIndex) => {
                  const uniqueId = `${catIndex}-${itemIndex}`;
                  const isOpen = openItems[uniqueId];
                  const isPlaying = playingId === uniqueId;

                  return (
                    <li key={itemIndex} className="bg-white">
                      <div className="w-full">
                        <button
                          onClick={() => toggleItem(catIndex, itemIndex)}
                          className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-900 pr-4">
                            {item.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4 sm:px-6 text-sm text-gray-500 animate-fadeIn">
                             <div className="flex items-start gap-3">
                                <p className="flex-1 leading-relaxed">{item.answer}</p>
                                <button
                                  onClick={(e) => handlePlay(e, item.answer, uniqueId)}
                                  className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                                    isPlaying 
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                  }`}
                                  title={isPlaying ? "Stop listening" : "Listen to answer"}
                                >
                                  {isPlaying ? (
                                    <StopCircle className="w-5 h-5" />
                                  ) : (
                                    <Volume2 className="w-5 h-5" />
                                  )}
                                </button>
                             </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {filteredScenarios.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">{t('helpCenter.noResults')} "{searchTerm}".</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('helpCenter.stillNeedHelp')}</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {t('helpCenter.stillNeedHelpDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm">
              <MessageSquare className="w-5 h-5 mr-2" />
              {t('helpCenter.chatSupport')}
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
              <Phone className="w-5 h-5 mr-2" />
              {t('helpCenter.requestCall')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
