import { useState } from 'react'
import { FamilyData } from '@/types/insurance'
import WelcomePage from '@/components/WelcomePage'
import FamilyFormWizard from '@/components/FamilyFormWizard'
import PlanningResult from '@/components/PlanningResult'
import PolicyDiagnosis from '@/components/PolicyDiagnosis'
import ProductRecommendation from '@/components/ProductRecommendation'

type AppStep = 'welcome' | 'family-form' | 'planning-result' | 'policy-diagnosis' | 'product-recommendation'

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome')
  const [familyData, setFamilyData] = useState<FamilyData | null>(null)

  const handleStepChange = (step: AppStep, data?: FamilyData) => {
    setCurrentStep(step)
    if (data) {
      setFamilyData(data)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomePage onNext={handleStepChange} />
      case 'family-form':
        return <FamilyFormWizard onComplete={handleStepChange} />
      case 'planning-result':
        return familyData ? (
          <PlanningResult 
            familyData={familyData} 
            onBack={() => setCurrentStep('family-form')}
            onNext={handleStepChange}
          />
        ) : null
      case 'policy-diagnosis':
        return <PolicyDiagnosis onBack={() => setCurrentStep('welcome')} />
      case 'product-recommendation':
        return <ProductRecommendation onBack={() => setCurrentStep('planning-result')} />
      default:
        return <WelcomePage onNext={handleStepChange} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {renderCurrentStep()}
    </div>
  )
}

export default App
