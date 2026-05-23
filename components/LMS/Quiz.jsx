import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitQuizScenario, abortScenario } from '@/redux/slice/lmsSlice';
import { getScenarioById } from './scenarios';

export default function Quiz() {
  const dispatch = useDispatch();
  const { activeScenarioId, scenarios } = useSelector((state) => state.lms);
  const scenario = activeScenarioId ? getScenarioById(activeScenarioId) : null;
  const scenarioState = scenarios.find((s) => s.id === activeScenarioId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const correctCountRef = useRef(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (!scenario || scenario.type !== 'quiz' || !scenarioState || scenarioState.status !== 'in_progress') {
    return null;
  }

  const quiz = scenario.quiz;
  if (!quiz?.questions?.length) return null;

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const passMark = scenario.passThreshold ?? quiz.passMark ?? 70;

  const handleAnswerSelect = (optionIndex) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
    setAnswered(true);
    if (optionIndex === currentQuestion.correctIndex) {
      correctCountRef.current += 1;
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      const finalScore = Math.round((correctCountRef.current / totalQuestions) * 100);
      setScore(finalScore);
      setCompleted(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    correctCountRef.current = 0;
    setScore(0);
    setCompleted(false);
  };

  const handleContinue = () => {
    dispatch(submitQuizScenario({
      scenarioId: scenario.id,
      score,
      passThreshold: passMark,
    }));
  };

  const handleExit = () => {
    if (confirm('Exit the quiz? Your progress on this attempt will be discarded.')) {
      dispatch(abortScenario());
    }
  };

  const isAnswerCorrect = selectedAnswer === currentQuestion.correctIndex;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-hidden">
        {!completed ? (
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-bold text-[#111] mb-1">{scenario.title}</h2>
                <p className="text-[12px] text-[#6b7280] uppercase tracking-[0.1em]">
                  Knowledge Check
                </p>
              </div>
              <button
                onClick={handleExit}
                className="h-8 w-8 inline-flex items-center justify-center text-[20px] text-[#6b7280] hover:text-[#dc2626]"
                title="Exit"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="w-full bg-[#e5e7eb] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#3b82f6] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-[0.12em] text-[#9ca3af] mb-6">
              Question {currentIndex + 1} of {totalQuestions}
            </p>

            <h3 className="text-[18px] font-bold text-[#111] mb-8 leading-[1.4]">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  className={`w-full flex items-start gap-4 p-4 rounded-[12px] border-2 text-left transition ${
                    selectedAnswer === index
                      ? isAnswerCorrect
                        ? 'border-[#16a34a] bg-[#ecfdf3]'
                        : 'border-[#dc2626] bg-[#fef2f2]'
                      : answered && index === currentQuestion.correctIndex
                      ? 'border-[#16a34a] bg-[#ecfdf3]'
                      : 'border-[#e5e7eb] bg-white hover:border-[#3b82f6]'
                  } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div
                    className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[12px] font-bold transition ${
                      selectedAnswer === index
                        ? isAnswerCorrect
                          ? 'border-[#16a34a] bg-[#16a34a] text-white'
                          : 'border-[#dc2626] bg-[#dc2626] text-white'
                        : answered && index === currentQuestion.correctIndex
                        ? 'border-[#16a34a] bg-[#16a34a] text-white'
                        : 'border-[#d1d5db] bg-white text-[#6b7280]'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-[14px] leading-[1.4] ${
                    selectedAnswer === index
                      ? isAnswerCorrect
                        ? 'text-[#047857] font-semibold'
                        : 'text-[#dc2626] font-semibold'
                      : 'text-[#111]'
                  }`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>

            {answered && (
              <div className={`p-4 rounded-[12px] mb-6 text-[13px] leading-[1.5] ${
                isAnswerCorrect
                  ? 'bg-[#ecfdf3] border border-[#a7f3d0] text-[#047857]'
                  : 'bg-[#fef2f2] border border-[#fecdd3] text-[#be123c]'
              }`}>
                <p className="font-semibold mb-1">
                  {isAnswerCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              disabled={!answered}
              className={`w-full py-3 px-4 rounded-[12px] font-bold text-[13px] uppercase tracking-[0.12em] transition ${
                answered
                  ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              {currentIndex === totalQuestions - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="text-[64px] font-bold mb-2">
                {score >= passMark ? '🎉' : '📚'}
              </div>
              <h2 className="text-[24px] font-bold text-[#111] mb-2">
                {score >= passMark ? 'Great Job!' : 'Almost There!'}
              </h2>
              <p className="text-[14px] text-[#6b7280] mb-4">
                {score >= passMark
                  ? `You've passed this assessment.`
                  : `You need ${passMark}% to pass.`}
              </p>
            </div>

            <div className="mb-6 p-4 bg-[#f3f4f6] rounded-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#6b7280] mb-2">
                Your Score
              </p>
              <p className="text-[40px] font-bold text-[#111]">{score}%</p>
              <p className="text-[12px] text-[#9ca3af]">
                {Math.round((score / 100) * totalQuestions)} of {totalQuestions} correct
              </p>
            </div>

            <div className={`mb-6 p-4 rounded-[12px] text-[13px] leading-[1.5] ${
              score >= passMark
                ? 'bg-[#ecfdf3] border border-[#a7f3d0] text-[#047857]'
                : 'bg-[#fffbeb] border border-[#fde68a] text-[#b45309]'
            }`}>
              {score >= passMark
                ? `You scored ${score}% — the next scenario is now unlocked.`
                : `You scored ${score}%. You need at least ${passMark}% to pass. Review and try again!`}
            </div>

            <div className="flex gap-3">
              {score < passMark ? (
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 rounded-[12px] border-2 border-[#3b82f6] text-[#3b82f6] font-bold text-[13px] uppercase tracking-[0.12em] transition hover:bg-[#eff6ff]"
                >
                  Retake Quiz
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 px-4 rounded-[12px] bg-[#3b82f6] text-white font-bold text-[13px] uppercase tracking-[0.12em] transition hover:bg-[#2563eb]"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
