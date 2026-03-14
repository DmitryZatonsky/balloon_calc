import "./App.css";
import { AddCategoryScreen } from "./components/AddCategoryScreen";
import { ArchiveScreen } from "./components/ArchiveScreen";
import { CalcScreen } from "./components/CalcScreen";
import { HomeScreen } from "./components/HomeScreen";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { PriceManagerScreen } from "./components/PriceManagerScreen";
import { useBalloonCalc } from "./hooks/useBalloonCalc";
import { buildItemKey, keepDigits } from "./utils";
import { useRef, useState } from "react";

const ONBOARDING_KEY = "balloon_calc_onboarding_seen";

function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_KEY) !== "1";
  });

  const {
    screen,
    setScreen,
    navigateBack,
    navigateForward,
    categories,
    openCategoryId,
    setOpenCategoryId,
    quantities,
    customAmounts,
    setCustomAmounts,
    lines,
    total,
    saveMessage,
    showSaveSuccess,
    saveSuccessToken,
    copyMessage,
    archiveMessage,
    currencyAbbr,
    newCategoryName,
    setNewCategoryName,
    targetCategoryId,
    setTargetCategoryId,
    draftProducts,
    setDraftProducts,
    formMessage,
    resultCardRef,
    sortedArchive,
    expandedArchiveId,
    setExpandedArchiveId,
    activateItem,
    setQuantity,
    handleCalculate,
    handleSaveCalculation,
    handleDeleteCalculation,
    handleEditCalculation,
    handleExportArchive,
    handleImportArchiveFile,
    handleCopy,
    resetCalc,
    saveCategory,
    deleteCategory,
    deleteProduct,
    updateProductPrice,
    customFigureRows,
    addCustomFigureRow,
    updateCustomFigureRow,
    removeCustomFigureRow,
    updateCurrencyAbbr,
  } = useBalloonCalc();

  const gestureStartRef = useRef<{
    x: number;
    y: number;
    edge: "left" | "right" | null;
  } | null>(null);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>): void {
    if (showOnboarding) {
      return;
    }
    const touch = event.touches[0];
    const width = window.innerWidth;
    const edgeZone = 32;
    const edge =
      touch.clientX <= edgeZone
        ? "left"
        : touch.clientX >= width - edgeZone
          ? "right"
          : null;

    gestureStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      edge,
    };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>): void {
    if (showOnboarding) {
      return;
    }
    if (!gestureStartRef.current || !gestureStartRef.current.edge) {
      return;
    }

    const start = gestureStartRef.current;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const minDistance = 56;

    if (Math.abs(dx) < minDistance || Math.abs(dy) > Math.abs(dx)) {
      return;
    }

    // Левый край -> свайп вправо = назад
    if (start.edge === "left" && dx > 0) {
      navigateBack();
    }

    // Правый край -> свайп влево = вперед
    if (start.edge === "right" && dx < 0) {
      navigateForward();
    }
  }

  function renderHeader(title: string) {
    return (
      <header className="screen-header">
        <button
          className="ui-btn ui-btn--ghost ghost-btn"
          onClick={navigateBack}
          aria-label="Назад"
          title="Назад"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2>{title}</h2>
        <span className="header-spacer" aria-hidden="true" />
      </header>
    );
  }

  function finishOnboarding(): void {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }

  return (
    <div className="app-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="app-card">
        {screen === "home" && <HomeScreen setScreen={setScreen} />}

        {screen === "calc" && (
          <CalcScreen
            categories={categories}
            openCategoryId={openCategoryId}
            setOpenCategoryId={setOpenCategoryId}
            quantities={quantities}
            customAmounts={customAmounts}
            buildItemKey={buildItemKey}
            activateItem={activateItem}
            setQuantity={setQuantity}
            setCustomAmounts={setCustomAmounts}
            keepDigits={keepDigits}
            handleCalculate={handleCalculate}
            resetCalc={resetCalc}
            lines={lines}
            total={total}
            currencyAbbr={currencyAbbr}
            handleCopy={handleCopy}
            handleSaveCalculation={handleSaveCalculation}
            saveMessage={saveMessage}
            copyMessage={copyMessage}
            resultCardRef={resultCardRef}
            renderHeader={renderHeader}
            customFigureRows={customFigureRows}
            addCustomFigureRow={addCustomFigureRow}
            updateCustomFigureRow={updateCustomFigureRow}
            removeCustomFigureRow={removeCustomFigureRow}
          />
        )}

        {screen === "archive" && (
          <ArchiveScreen
            sortedArchive={sortedArchive}
            expandedArchiveId={expandedArchiveId}
            setExpandedArchiveId={setExpandedArchiveId}
            currencyAbbr={currencyAbbr}
            handleEditCalculation={handleEditCalculation}
            handleDeleteCalculation={handleDeleteCalculation}
            handleExportArchive={handleExportArchive}
            handleImportArchiveFile={handleImportArchiveFile}
            archiveMessage={archiveMessage}
            renderHeader={renderHeader}
          />
        )}

        {screen === "add" && (
          <AddCategoryScreen
            categories={categories}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            targetCategoryId={targetCategoryId}
            setTargetCategoryId={setTargetCategoryId}
            draftProducts={draftProducts}
            setDraftProducts={setDraftProducts}
            saveCategory={saveCategory}
            formMessage={formMessage}
            renderHeader={renderHeader}
          />
        )}

        {screen === "price" && (
          <PriceManagerScreen
            categories={categories}
            formMessage={formMessage}
            currencyAbbr={currencyAbbr}
            updateCurrencyAbbr={updateCurrencyAbbr}
            deleteCategory={deleteCategory}
            deleteProduct={deleteProduct}
            updateProductPrice={updateProductPrice}
            renderHeader={renderHeader}
          />
        )}

        {showSaveSuccess && (
          <div key={saveSuccessToken} className="save-success-overlay" aria-hidden="true">
            <div className="save-success-circle">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 12.5l4.2 4.2L18 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      {showOnboarding && <OnboardingOverlay onFinish={finishOnboarding} />}
    </div>
  );
}

export default App;
