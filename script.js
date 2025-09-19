// Flashcards App - Vanilla JS with localStorage
      (function () {
        const STORAGE_KEY = "flashcards.v1";

        /** @typedef {{ id: string, question: string, answer: string, createdAt: number, updatedAt: number }} Flashcard */

        /** @type {Flashcard[]} */
        let flashcards = [];
        let currentIndex = 0;
        let showingAnswer = false;
        let isEditing = false;
        let editingIndex = -1; // -1 means adding new

        // DOM elements
        const cardEl = document.getElementById("card");
        const cardFrontContentEl = document.getElementById("cardFrontContent");
        const cardBackContentEl = document.getElementById("cardBackContent");
        const counterEl = document.getElementById("counter");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const toggleBtn = document.getElementById("toggleBtn");
        const addBtn = document.getElementById("addBtn");
        const editBtn = document.getElementById("editBtn");
        const deleteBtn = document.getElementById("deleteBtn");

        const editorSection = document.getElementById("editor");
        const editorTitle = document.getElementById("editorTitle");
        const editorForm = document.getElementById("editorForm");
        const questionInput = document.getElementById("questionInput");
        const answerInput = document.getElementById("answerInput");
        const cancelBtn = document.getElementById("cancelBtn");

        function loadFromStorage() {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return undefined;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return undefined;
            return parsed;
          } catch (err) {
            console.warn("Failed to read from localStorage, starting fresh.", err);
            return undefined;
          }
        }

        function saveToStorage() {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards));
        }

        function seedDataIfEmpty() {
          if (flashcards.length > 0) return;
          const now = Date.now();
          flashcards = [
            {
              id: String(now),
              question: "What is the capital of France?",
              answer: "Paris",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: String(now + 1),
              question: "What does HTML stand for?",
              answer: "HyperText Markup Language",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: String(now + 2),
              question: "2 + 2 = ?",
              answer: "4",
              createdAt: now,
              updatedAt: now,
            },
          ];
          saveToStorage();
        }

        function formatCounter() {
          const total = flashcards.length;
          if (total === 0) return "0 / 0";
          return `${currentIndex + 1} / ${total}`;
        }

        function render() {
          // Editor visibility
          editorSection.classList.toggle("hidden", !isEditing);
          editorSection.setAttribute("aria-hidden", String(!isEditing));

          const hasCards = flashcards.length > 0;

          if (!hasCards) {
            cardFrontContentEl.textContent = "No flashcards yet. Click Add to create your first card.";
            cardBackContentEl.textContent = "";
            toggleBtn.disabled = true;
            editBtn.disabled = true;
            deleteBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            counterEl.textContent = formatCounter();
            return;
          }

          // Clamp currentIndex just in case
          if (currentIndex < 0) currentIndex = 0;
          if (currentIndex >= flashcards.length) currentIndex = flashcards.length - 1;

          const current = flashcards[currentIndex];
          cardFrontContentEl.textContent = current.question || "(No question)";
          cardBackContentEl.textContent = current.answer || "(No answer)";

          // Update card flip state
          if (showingAnswer) {
            cardEl.classList.add('is-flipped');
            toggleBtn.textContent = "Show Question";
          } else {
            cardEl.classList.remove('is-flipped');
            toggleBtn.textContent = "Show Answer";
          }

          // Enable/disable actions
          toggleBtn.disabled = false;
          editBtn.disabled = isEditing;
          deleteBtn.disabled = isEditing;

          // Prev/Next are always available; we wrap around
          prevBtn.disabled = isEditing;
          nextBtn.disabled = isEditing;

          counterEl.textContent = formatCounter();
        }

        function nextCard() {
          if (flashcards.length === 0) return;
          currentIndex = (currentIndex + 1) % flashcards.length;
          showingAnswer = false;
          render();
        }

        function prevCard() {
          if (flashcards.length === 0) return;
          currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
          showingAnswer = false;
          render();
        }

        function toggleAnswer() {
          if (flashcards.length === 0) return;
          showingAnswer = !showingAnswer;
          render();
        }

        function startAdd() {
          isEditing = true;
          editingIndex = -1;
          editorTitle.textContent = "Add Flashcard";
          questionInput.value = "";
          answerInput.value = "";
          questionInput.focus();
          render();
        }

        function startEdit() {
          if (flashcards.length === 0) return;
          isEditing = true;
          editingIndex = currentIndex;
          editorTitle.textContent = "Edit Flashcard";
          const current = flashcards[currentIndex];
          questionInput.value = current.question;
          answerInput.value = current.answer;
          questionInput.focus();
          render();
        }

        function cancelEdit() {
          isEditing = false;
          editingIndex = -1;
          render();
        }

        function saveEdit(ev) {
          ev.preventDefault();
          const question = questionInput.value.trim();
          const answer = answerInput.value.trim();
          if (!question || !answer) {
            alert("Please fill in both the question and answer.");
            return;
          }
          const now = Date.now();
          if (editingIndex === -1) {
            const newCard = {
              id: String(now),
              question,
              answer,
              createdAt: now,
              updatedAt: now,
            };
            flashcards.push(newCard);
            currentIndex = flashcards.length - 1;
          } else {
            const existing = flashcards[editingIndex];
            existing.question = question;
            existing.answer = answer;
            existing.updatedAt = now;
            currentIndex = editingIndex;
          }
          saveToStorage();
          showingAnswer = false;
          isEditing = false;
          editingIndex = -1;
          render();
        }

        function deleteCurrent() {
          if (flashcards.length === 0) return;
          const ok = confirm("Delete this flashcard? This cannot be undone.");
          if (!ok) return;
          flashcards.splice(currentIndex, 1);
          if (currentIndex >= flashcards.length) {
            currentIndex = Math.max(0, flashcards.length - 1);
          }
          saveToStorage();
          showingAnswer = false;
          render();
        }

        function attachEvents() {
          nextBtn.addEventListener("click", nextCard);
          prevBtn.addEventListener("click", prevCard);
          toggleBtn.addEventListener("click", toggleAnswer);
          addBtn.addEventListener("click", startAdd);
          editBtn.addEventListener("click", startEdit);
          deleteBtn.addEventListener("click", deleteCurrent);
          cancelBtn.addEventListener("click", cancelEdit);
          editorForm.addEventListener("submit", saveEdit);

          // Keyboard shortcuts
          document.addEventListener("keydown", (e) => {
            if (isEditing) return;
            if (e.key === "ArrowRight") nextCard();
            else if (e.key === "ArrowLeft") prevCard();
            else if (e.key.toLowerCase() === "f") toggleAnswer();
          });
        }

        function init() {
          const fromStorage = loadFromStorage();
          flashcards = Array.isArray(fromStorage) ? fromStorage : [];
          seedDataIfEmpty();
          attachEvents();
          render();
        }

        init();
      })();
