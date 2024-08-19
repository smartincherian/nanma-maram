// src/Counter.js

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { DB } from "../../config/firebase";
import { addCounter } from "../../firebase/intention/add";

const Counter = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState(1);
  const [counterData, setCounterData] = useState({});

  useEffect(() => {
    const docRef = doc(DB, "intentions", id);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setCounterData(doc.data());
        } else {
          console.log("No such document!");
        }
      },
      (error) => {
        console.log("Error getting document:", error);
      }
    );
    return () => unsubscribe();
  }, [id]);

  console.log({ counterData });

  const handleAdd = async () => {
    try {
      await addCounter({ id, value: inputValue });
    } catch (error) {
      console.error("Error in handleAdd :", error);
      alert(error?.message || "Something went wrong");
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  console.log({ counterData });

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card variant="outlined" sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            {`${
              counterData?.isMotherIntention
                ? `Mother Mary Intentions`
                : `Intention`
            } : ${counterData?.intention}`}
          </Typography>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Current Count: {counterData?.count}
            </Typography>
            {counterData?.maxCount ? (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Maximum Count: {counterData?.maxCount}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Remaining Count: {counterData?.maxCount - counterData?.count}
                </Typography>
              </>
            ) : null}
          </Box>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={12} sm={8}>
              <TextField
                label="Value to Add"
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                fullWidth
                sx={{ mb: 2 }}
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 1, bgcolor: "background.paper" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAdd}
                fullWidth
                sx={{ height: "100%" }}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Counter;
