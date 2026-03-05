import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type Props = {
  onFinish: () => void;
};

type Step = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function OnboardingOverlay({ onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState<number>(0);

  const steps = useMemo<Step[]>(
    () => [
      {
        title: "Добро пожаловать",
        description:
          "Это карманный калькулятор шариков. Он помогает быстро собрать заказ и посчитать общую стоимость.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="8" rx="4.8" ry="5.8" />
            <path d="M10.8 13.1h2.4l-.6 1.9h-1.2l-.6-1.9z" strokeLinejoin="round" />
            <path d="M10.6 5.2c.6-1.1 1.4-1.8 2.6-2.1" strokeLinecap="round" />
            <path
              d="M12 15.1c1.1 1.8-.7 2.8-.4 4.4.2 1.2 1.1 2 .6 3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Как считать",
        description:
          "Открой «Рассчитать стоимость», добавь позиции через «+», нажми «Рассчитать», затем «Сохранить».",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h8" />
          </svg>
        ),
      },
      {
        title: "Архив и резерв",
        description:
          "В архиве можно открывать прошлые расчеты, удалять их, а также экспортировать в файл и восстановить обратно.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16v13H4zM8 4h8M9 11h6M9 15h6" />
          </svg>
        ),
      },
      {
        title: "Управление прайсом",
        description:
          "Добавляй категории и товары, меняй цены и валюту. Все данные хранятся локально на этом устройстве.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 4l8 8-7 7-8-8V4zM14.5 8.5h.01" />
          </svg>
        ),
      },
    ],
    [],
  );

  const isLast = stepIndex === steps.length - 1;
  const currentStep = steps[stepIndex];

  function handleNext(): void {
    if (isLast) {
      onFinish();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Обучение">
      <div className="onboarding-card">
        <div className="onboarding-icon-wrap">{currentStep.icon}</div>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.description}</p>

        <div className="onboarding-dots" aria-hidden="true">
          {steps.map((_, index) => (
            <span key={index} className={`onboarding-dot ${index === stepIndex ? "is-active" : ""}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="ui-btn ui-btn--ghost" onClick={onFinish}>
            Пропустить
          </button>
          <button className="ui-btn ui-btn--primary" onClick={handleNext}>
            {isLast ? "Начать" : "Далее"}
          </button>
        </div>
      </div>
    </div>
  );
}
