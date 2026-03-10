import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { specialists } from '../data/mockData';

const SpecialistDetail = () => {
  const { id } = useParams();
  const { lang } = useLanguage();
  const specialist = specialists.find(s => s.id === parseInt(id));
  if (!specialist) return <div>Not found</div>;

  return (
    <div className="container">
      <h1>{specialist.name}</h1>
      <p>{specialist.specialty[lang]}</p>
      <p>{specialist.experience} {lang === 'UA' ? 'років досвіду' : 'years experience'}</p>
    </div>
  );
};

export default SpecialistDetail;