import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="dropdown">
            <button
                className="btn btn-outline-secondary dropdown-toggle btn-sm"
                type="button"
                id="languageDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i className="bi bi-globe me-1"></i>
                {i18n.language === 'id' ? 'ID' : 'EN'}
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
                <li>
                    <button
                        className={`dropdown-item ${i18n.language === 'en' ? 'active' : ''}`}
                        onClick={() => changeLanguage('en')}
                    >
                        English
                    </button>
                </li>
                <li>
                    <button
                        className={`dropdown-item ${i18n.language === 'id' ? 'active' : ''}`}
                        onClick={() => changeLanguage('id')}
                    >
                        Bahasa Indonesia
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default LanguageSwitcher;
