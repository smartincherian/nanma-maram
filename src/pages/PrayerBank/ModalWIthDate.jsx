import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  FormHelperText,
  ListItemAvatar,
  Avatar,
  useTheme,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { groups } from "./constants";

const SelectedGroupDate = ({ group, date }) => {
  if (!group || !date) {
    return null;
  }
  return (
    <FormHelperText>
      <b>
        <i>
          Group : {groups.find((item) => item.id === group)?.name || "Unknown"}
          {" | "}Date : {date?.format("DD-MMM-YYYY")}. Please confirm to
          proceed.
        </i>
      </b>
    </FormHelperText>
  );
};

const ModalWithDatePicker = ({ open, setOpen, handleSubmitData }) => {
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      selectedGroup: "",
      selectedDate: dayjs(),
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Detects small screens

  const selectedGroup = watch("selectedGroup");
  const selectedDate = watch("selectedDate");

  const onSubmit = (data) => {
    handleSubmitData(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
      <DialogTitle>
        <Typography variant={isMobile ? "body2" : "body1"}>
          Select your Group and Date
        </Typography>
      </DialogTitle>
      <DialogContent>
        {errors.selectedGroup && (
          <FormHelperText error>
            {errors?.selectedGroup?.message}
          </FormHelperText>
        )}

        {/* Date Picker */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Controller
            name="selectedDate"
            control={control}
            rules={{ required: "Date is required" }}
            render={({ field }) => (
              <DatePicker
                label="Select Date"
                value={field.value}
                disableFuture
                format="DD-MMM-YYYY"
                onChange={(newDate) => field.onChange(newDate)}
                sx={{ marginTop: 2, width: "100%" }}
              />
            )}
          />
        </LocalizationProvider>

        <SelectedGroupDate group={selectedGroup} date={selectedDate} />

        <Controller
          name="selectedGroup"
          control={control}
          rules={{ required: "Please select group." }}
          render={({ field }) => (
            <List>
              {groups.map((item) => (
                <ListItem
                  button
                  key={item.id}
                  selected={selectedGroup === item.id}
                  onClick={() => field.onChange(item.id)}
                  sx={{
                    bgcolor: selectedGroup === item.id && "primary.main",
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={item.image} alt={item.name}>
                      {item.name.charAt(7)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"}>
                        {item.name}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        />
        {errors.selectedGroup && (
          <FormHelperText error>
            {errors?.selectedGroup?.message}
          </FormHelperText>
        )}

        {errors.selectedDate && (
          <FormHelperText error>{errors?.selectedDate?.message}</FormHelperText>
        )}

        <SelectedGroupDate group={selectedGroup} date={selectedDate} />
      </DialogContent>

      {/* Modal Actions */}
      <DialogActions>
        <Button
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalWithDatePicker;
