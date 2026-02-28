import { useState } from 'react';
import { WelcomePage } from './WelcomePage';
import { StepForm } from './StepForm';
import { PreviewPage } from './PreviewPage';
import { useGoalForm } from './hooks/useGoalForm';

type PageState = 'welcome' | 'form' | 'preview';

export default function GoalGenerator() {
  const [page, setPage] = useState<PageState>('welcome');
  const {
    formData,
    currentStep,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    canProceed,
    isStepValid
  } = useGoalForm();

  const handleStart = () => {
    setPage('form');
  };

  const handleComplete = () => {
    setPage('preview');
  };

  const handleBackToForm = () => {
    setPage('form');
  };

  const handleReset = () => {
    resetForm();
    setPage('welcome');
  };

  if (page === 'welcome') {
    return <WelcomePage onStart={handleStart} />;
  }

  if (page === 'preview') {
    return (
      <PreviewPage
        formData={formData}
        onBack={handleBackToForm}
        onReset={handleReset}
      />
    );
  }

  return (
    <StepForm
      currentStep={currentStep}
      formData={formData}
      onUpdate={updateField}
      onNext={nextStep}
      onPrev={prevStep}
      onStepClick={goToStep}
      canProceed={canProceed()}
      isStepValid={isStepValid}
      onComplete={handleComplete}
    />
  );
}
