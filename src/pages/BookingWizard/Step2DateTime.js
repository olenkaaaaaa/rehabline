import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

import {
  getServiceName,
  getSpecialistName,
  getLocationName,
} from './BookingWizard';

const Step2DateTime = ({
  bookingData,
  updateBookingData,
  selectedService,
  selectedSpecialist,
  selectedLocation,
  availableSpecialists,
  availableLocations,
  calendarDays,
  slotsLoading,
  nextStep,
  prevStep,
}) => {
  const { lang } = useLanguage();

  const canContinue = Boolean(
    bookingData.serviceId &&
      bookingData.specialistId &&
      bookingData.locationId &&
      bookingData.date &&
      bookingData.time
  );

  const handleSpecialistChange = (event) => {
    updateBookingData({
      specialistId: event.target.value
        ? Number(event.target.value)
        : null,

      locationId: null,
      date: null,
      time: null,
    });
  };

  const handleLocationChange = (event) => {
    updateBookingData({
      locationId: event.target.value
        ? Number(event.target.value)
        : null,

      date: null,
      time: null,
    });
  };

  const handleDateSelect = (date) => {
    updateBookingData({
      date,
      time: null,
    });
  };

  const handleTimeSelect = (time) => {
    updateBookingData({
      time,
    });
  };

  const selectedDaySlots =
    calendarDays.find(
      (day) => day.date === bookingData.date
    )?.slots || [];

  return (
    <div className="booking-card">
      <h2>
        {lang === 'UA'
          ? 'Оберіть дату та час'
          : 'Choose date and time'}
      </h2>

      <div className="booking-summary">
        <div className="summary-row">
          <span className="summary-label">
            {lang === 'UA'
              ? 'Послуга'
              : 'Service'}
          </span>

          <span className="summary-value">
            {getServiceName(
              selectedService,
              lang
            )}
          </span>
        </div>

        {selectedSpecialist && (
          <div className="summary-row">
            <span className="summary-label">
              {lang === 'UA'
                ? 'Спеціаліст'
                : 'Specialist'}
            </span>

            <span className="summary-value">
              {getSpecialistName(
                selectedSpecialist
              )}
            </span>
          </div>
        )}

        {selectedLocation && (
          <div className="summary-row">
            <span className="summary-label">
              {lang === 'UA'
                ? 'Локація'
                : 'Location'}
            </span>

            <span className="summary-value">
              {getLocationName(
                selectedLocation,
                lang
              )}
            </span>
          </div>
        )}
      </div>

      <div className="booking-grid">
        <div className="form-group">
          <label>
            {lang === 'UA'
              ? 'Спеціаліст'
              : 'Specialist'}
          </label>

          <select
            value={
              bookingData.specialistId || ''
            }
            onChange={
              handleSpecialistChange
            }
          >
            <option value="">
              {lang === 'UA'
                ? 'Оберіть спеціаліста'
                : 'Select specialist'}
            </option>

            {availableSpecialists.map(
              (specialist) => (
                <option
                  key={specialist.id}
                  value={specialist.id}
                >
                  {getSpecialistName(
                    specialist
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <div className="form-group">
          <label>
            {lang === 'UA'
              ? 'Локація'
              : 'Location'}
          </label>

          <select
            value={
              bookingData.locationId || ''
            }
            onChange={
              handleLocationChange
            }
            disabled={
              !bookingData.specialistId
            }
          >
            <option value="">
              {lang === 'UA'
                ? 'Оберіть локацію'
                : 'Select location'}
            </option>

            {availableLocations.map(
              (location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {getLocationName(
                    location,
                    lang
                  )}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {!bookingData.specialistId && (
        <div className="empty-state">
          <p>
            {lang === 'UA'
              ? 'Спочатку оберіть спеціаліста.'
              : 'Please select a specialist first.'}
          </p>
        </div>
      )}

      {bookingData.specialistId &&
        !bookingData.locationId && (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Оберіть локацію.'
                : 'Select location.'}
            </p>
          </div>
        )}

      {bookingData.specialistId &&
        bookingData.locationId &&
        slotsLoading && (
          <div className="empty-state">
            <p>
              {lang === 'UA'
                ? 'Завантаження слотів...'
                : 'Loading slots...'}
            </p>
          </div>
        )}

      {bookingData.specialistId &&
        bookingData.locationId &&
        !slotsLoading && (
          <>
            <div className="calendar-days">
              {calendarDays.map((day) => {
                const isSelected =
                  bookingData.date ===
                  day.date;

                const hasSlots =
                  day.slots.length > 0;

                return (
                  <button
                    key={day.date}
                    type="button"
                    className={`calendar-day ${
                      isSelected
                        ? 'selected'
                        : ''
                    } ${
                      !hasSlots
                        ? 'disabled'
                        : ''
                    }`}
                    disabled={!hasSlots}
                    onClick={() =>
                      handleDateSelect(
                        day.date
                      )
                    }
                  >
                    <strong>
                      {day.dayNumber}
                    </strong>

                    <small>
                      {day.fullLabel}
                    </small>
                  </button>
                );
              })}
            </div>

            {bookingData.date && (
              <>
                <h3>
                  {lang === 'UA'
                    ? 'Доступний час'
                    : 'Available time'}
                </h3>

                <div className="time-slots">
                  {selectedDaySlots.map(
                    (slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot ${
                          bookingData.time ===
                          slot
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          handleTimeSelect(
                            slot
                          )
                        }
                      >
                        {slot}
                      </button>
                    )
                  )}
                </div>

                {selectedDaySlots.length ===
                  0 && (
                  <div className="empty-state">
                    <p>
                      {lang === 'UA'
                        ? 'На цю дату немає вільного часу.'
                        : 'No available time for this date.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

      <div className="booking-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={prevStep}
        >
          {lang === 'UA'
            ? 'Назад'
            : 'Back'}
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={nextStep}
          disabled={
            !canContinue || slotsLoading
          }
        >
          {lang === 'UA'
            ? 'Далі'
            : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Step2DateTime;