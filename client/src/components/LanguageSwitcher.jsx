import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import clsx from 'clsx';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'English', label: 'English' },
    { code: 'hi', name: 'Hindi', label: 'हिंदी' },
    { code: 'te', name: 'Telugu', label: 'తెలుగు' }
  ];

  return (
    <Menu as="div" className="relative ml-3">
      <Menu.Button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium uppercase hidden sm:block">{i18n.resolvedLanguage}</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  onClick={() => changeLanguage(lang.code)}
                  className={clsx(
                    active ? 'bg-gray-100' : '',
                    'block px-4 py-2 text-sm text-gray-700 w-full text-left',
                    i18n.resolvedLanguage === lang.code ? 'font-bold text-primary-600' : ''
                  )}
                >
                  {lang.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
