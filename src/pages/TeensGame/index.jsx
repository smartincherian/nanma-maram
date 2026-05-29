import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { DB } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";

const clues = [
  {
    id: 1,
    question: "🔒 Clue 1: What is the shortest verse in the Bible? (one word)",
    answer: "wept",
    hint: "John 11:35",
  },
  {
    id: 2,
    question:
      "🔒 Clue 2: Unscramble this verse:\n'world | his | loved | that | so | son | gave | only | God'",
    answer: "God so loved the world that he gave his only son",
    hint: "John 3:16",
  },
  {
    id: 3,
    question: "🔒 Clue 3: What day did Jesus rise from the dead?",
    answer: "Sunday",
    hint: "Think Easter morning!",
  },
];

function TeensGame() {
  const [step, setStep] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentClue = clues[step];

  const handleCheckAnswer = async () => {
    const cleanedInput = userAnswer.trim().toLowerCase();
    const expected = currentClue.answer.trim().toLowerCase();

    if (cleanedInput === expected) {
      if (step + 1 < clues.length) {
        setStep(step + 1);
        setUserAnswer("");
      } else {
        setCompleted(true);
        await logEscapeGameSuccess();
      }
    } else {
      alert("❌ Incorrect! Try again or check the hint.");
    }
  };

  const logEscapeGameSuccess = async () => {
    setSaving(true);
    const phone = localStorage.getItem("phone") || "unknown";
    const name = localStorage.getItem("name") || "unknown";
    const docId = `escapeGame_${phone}_${Date.now()}`;

    await setDoc(doc(DB, "teensEscapeGameLogs", docId), {
      name,
      phone,
      game: "Escape from the Tomb",
      completedAt: new Date().toISOString(),
    });

    setSaving(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={5} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          🕵️ Escape from the Tomb
        </Typography>

        {!completed ? (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              {currentClue.question}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Hint: {currentClue.hint}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Your Answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckAnswer}
              sx={{ mt: 2 }}
            >
              Submit
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
              🎉 Congratulations! You escaped the tomb.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Jesus is Risen! Let us live in the joy of the Resurrection.
            </Typography>
            {saving && (
              <Typography variant="caption" color="text.secondary">
                Logging your success...
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default TeensGame;
