'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useTravelData } from '@/hooks/useTravelData';
import Modal from '@/components/Modal';
import {
  TravelPlan,
  Flight,
  Hotel,
  Attraction,
  TravelCurrency,
  TRAVEL_CURRENCIES,
  ATTRACTION_CATEGORIES,
  AttractionCategory,
  getFlightTrackingUrl,
  calculateNights,
  formatDuration,
} from '@/types/travel';
import Link from 'next/link';

export default function TravelPage() {
  const { t, language } = useI18n();
  const travel = useTravelData();

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showAttractionModal, setShowAttractionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Edit states
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);
  const [confirmingAttractionId, setConfirmingAttractionId] = useState<string | null>(null);

  // Form states for plan
  const [planForm, setPlanForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    defaultCurrency: 'TWD' as TravelCurrency,
    notes: '',
  });

  // Form states for flight
  const [flightForm, setFlightForm] = useState({
    type: 'departure' as 'departure' | 'arrival',
    date: '',
    flightNumber: '',
    airline: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    cost: 0,
    currency: 'TWD' as TravelCurrency,
    notes: '',
  });

  // Form states for hotel
  const [hotelForm, setHotelForm] = useState({
    name: '',
    checkInDate: '',
    checkOutDate: '',
    address: '',
    costPerNight: 0,
    totalCost: 0,
    currency: 'TWD' as TravelCurrency,
    confirmationNumber: '',
    phone: '',
    link: '',
    notes: '',
  });

  // Form states for attraction
  const [attractionForm, setAttractionForm] = useState({
    name: '',
    category: 'other' as AttractionCategory,
    address: '',
    cost: 0,
    currency: 'TWD' as TravelCurrency,
    estimatedDuration: 60,
    notes: '',
    link: '',
    openingHours: '',
  });

  // Selected day for confirming attraction
  const [selectedDay, setSelectedDay] = useState('');

  // Active plan
  const plan = travel.activePlan;

  // ========== Handlers ==========

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      defaultCurrency: 'TWD',
      notes: '',
    });
    setShowPlanModal(true);
  };

  const openEditPlan = (p: TravelPlan) => {
    setEditingPlan(p);
    setPlanForm({
      name: p.name,
      destination: p.destination || '',
      startDate: p.startDate,
      endDate: p.endDate,
      defaultCurrency: p.defaultCurrency,
      notes: p.notes || '',
    });
    setShowPlanModal(true);
  };

  const savePlan = () => {
    if (!planForm.name || !planForm.startDate || !planForm.endDate) return;

    if (editingPlan) {
      travel.updatePlan(editingPlan.id, planForm);
    } else {
      travel.addPlan(planForm);
    }
    setShowPlanModal(false);
  };

  const openNewFlight = () => {
    setEditingFlight(null);
    const defaultCurrency = plan?.defaultCurrency || 'TWD';
    setFlightForm({
      type: 'departure',
      date: plan?.startDate || '',
      flightNumber: '',
      airline: '',
      departureAirport: '',
      arrivalAirport: '',
      departureTime: '',
      arrivalTime: '',
      cost: 0,
      currency: defaultCurrency,
      notes: '',
    });
    setShowFlightModal(true);
  };

  const openEditFlight = (f: Flight) => {
    setEditingFlight(f);
    setFlightForm({
      type: f.type,
      date: f.date,
      flightNumber: f.flightNumber,
      airline: f.airline || '',
      departureAirport: f.departureAirport,
      arrivalAirport: f.arrivalAirport,
      departureTime: f.departureTime || '',
      arrivalTime: f.arrivalTime || '',
      cost: f.cost,
      currency: f.currency,
      notes: f.notes || '',
    });
    setShowFlightModal(true);
  };

  const saveFlight = () => {
    if (!flightForm.date || !flightForm.flightNumber) return;

    if (editingFlight) {
      travel.updateFlight(editingFlight.id, flightForm);
    } else {
      travel.addFlight(flightForm);
    }
    setShowFlightModal(false);
  };

  const openNewHotel = () => {
    setEditingHotel(null);
    const defaultCurrency = plan?.defaultCurrency || 'TWD';
    setHotelForm({
      name: '',
      checkInDate: plan?.startDate || '',
      checkOutDate: plan?.endDate || '',
      address: '',
      costPerNight: 0,
      totalCost: 0,
      currency: defaultCurrency,
      confirmationNumber: '',
      phone: '',
      link: '',
      notes: '',
    });
    setShowHotelModal(true);
  };

  const openEditHotel = (h: Hotel) => {
    setEditingHotel(h);
    setHotelForm({
      name: h.name,
      checkInDate: h.checkInDate,
      checkOutDate: h.checkOutDate,
      address: h.address || '',
      costPerNight: h.costPerNight,
      totalCost: h.totalCost,
      currency: h.currency,
      confirmationNumber: h.confirmationNumber || '',
      phone: h.phone || '',
      link: h.link || '',
      notes: h.notes || '',
    });
    setShowHotelModal(true);
  };

  const saveHotel = () => {
    if (!hotelForm.name || !hotelForm.checkInDate || !hotelForm.checkOutDate) return;

    // Auto-calculate total cost if costPerNight is set
    const nights = calculateNights(hotelForm.checkInDate, hotelForm.checkOutDate);
    const totalCost = hotelForm.totalCost || hotelForm.costPerNight * nights;

    const data = { ...hotelForm, totalCost };

    if (editingHotel) {
      travel.updateHotel(editingHotel.id, data);
    } else {
      travel.addHotel(data);
    }
    setShowHotelModal(false);
  };

  const openNewAttraction = () => {
    setEditingAttraction(null);
    const defaultCurrency = plan?.defaultCurrency || 'TWD';
    setAttractionForm({
      name: '',
      category: 'other',
      address: '',
      cost: 0,
      currency: defaultCurrency,
      estimatedDuration: 60,
      notes: '',
      link: '',
      openingHours: '',
    });
    setShowAttractionModal(true);
  };

  const openEditAttraction = (a: Attraction) => {
    setEditingAttraction(a);
    setAttractionForm({
      name: a.name,
      category: a.category,
      address: a.address || '',
      cost: a.cost,
      currency: a.currency,
      estimatedDuration: a.estimatedDuration,
      notes: a.notes || '',
      link: a.link || '',
      openingHours: a.openingHours || '',
    });
    setShowAttractionModal(true);
  };

  const saveAttraction = () => {
    if (!attractionForm.name) return;

    if (editingAttraction) {
      travel.updateUnconfirmedAttraction(editingAttraction.id, attractionForm);
    } else {
      travel.addUnconfirmedAttraction(attractionForm);
    }
    setShowAttractionModal(false);
  };

  const openConfirmAttraction = (attractionId: string) => {
    setConfirmingAttractionId(attractionId);
    setSelectedDay(plan?.dailyItineraries[0]?.date || '');
    setShowConfirmModal(true);
  };

  const handleConfirmAttraction = () => {
    if (confirmingAttractionId && selectedDay) {
      travel.confirmAttraction(confirmingAttractionId, selectedDay);
      setShowConfirmModal(false);
    }
  };

  const getCurrencySymbol = (currency: TravelCurrency) => {
    return TRAVEL_CURRENCIES.find(c => c.value === currency)?.symbol || currency;
  };

  const getCategoryIcon = (category: AttractionCategory) => {
    return ATTRACTION_CATEGORIES.find(c => c.value === category)?.icon || '📍';
  };

  const getCategoryLabel = (category: AttractionCategory) => {
    const cat = ATTRACTION_CATEGORIES.find(c => c.value === category);
    return language === 'zh-TW' ? cat?.labelZh : cat?.label || category;
  };

  if (!travel.isLoaded) {
    return <div className="p-4">{t.common.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.travel.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t.travel.subtitle}</p>
          </div>
          <button onClick={openNewPlan} className="btn-primary mt-3 sm:mt-0">
            {t.travel.newPlan}
          </button>
        </div>

        {/* Trip selector */}
        {travel.plans.length > 0 && (
          <div className="card p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {travel.plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => travel.setActivePlan(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    travel.activePlan?.id === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!plan && travel.plans.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.travel.noPlans}</p>
          </div>
        )}

        {plan && (
          <>
            {/* Plan info bar */}
            <div className="card p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                    {plan.destination && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">- {plan.destination}</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.startDate} ~ {plan.endDate}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button onClick={() => openEditPlan(plan)} className="btn text-sm">
                    {t.common.edit}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t.travel.deletePlanConfirm)) {
                        travel.deletePlan(plan.id);
                      }
                    }}
                    className="btn-danger text-sm"
                  >
                    {t.common.delete}
                  </button>
                </div>
              </div>
            </div>

            {/* Flight Section */}
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.travel.flights}
                </h3>
                <button onClick={openNewFlight} className="btn-primary text-sm">
                  {t.travel.addFlight}
                </button>
              </div>

              {plan.flights.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t.travel.noItems}</p>
              ) : (
                <div className="space-y-3">
                  {plan.flights.map(f => (
                    <div
                      key={f.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            f.type === 'departure'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {f.type === 'departure' ? t.travel.departure : t.travel.arrival}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {f.flightNumber}
                          </span>
                          {f.airline && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">{f.airline}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>{f.date}</span>
                          <span className="mx-2">|</span>
                          <span>{f.departureAirport} → {f.arrivalAirport}</span>
                          {f.departureTime && (
                            <>
                              <span className="mx-2">|</span>
                              <span>{f.departureTime} - {f.arrivalTime || '?'}</span>
                            </>
                          )}
                        </div>
                        {f.cost > 0 && (
                          <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">
                            {getCurrencySymbol(f.currency)} {f.cost.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <a
                          href={getFlightTrackingUrl(f.flightNumber, f.date)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn text-xs"
                        >
                          {t.travel.viewFlightInfo}
                        </a>
                        <button onClick={() => openEditFlight(f)} className="btn text-xs">
                          {t.common.edit}
                        </button>
                        <button onClick={() => travel.deleteFlight(f.id)} className="btn-danger text-xs">
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hotel Section */}
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.travel.hotels}
                </h3>
                <button onClick={openNewHotel} className="btn-primary text-sm">
                  {t.travel.addHotel}
                </button>
              </div>

              {plan.hotels.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t.travel.noItems}</p>
              ) : (
                <div className="space-y-3">
                  {plan.hotels.map(h => {
                    const nights = calculateNights(h.checkInDate, h.checkOutDate);
                    return (
                      <div
                        key={h.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {h.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>{h.checkInDate} ~ {h.checkOutDate}</span>
                            <span className="mx-2">|</span>
                            <span>{nights} {t.travel.nights}</span>
                          </div>
                          {h.address && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {h.address}
                            </div>
                          )}
                          {h.confirmationNumber && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {t.travel.confirmationNumber}: {h.confirmationNumber}
                            </div>
                          )}
                          {h.totalCost > 0 && (
                            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">
                              {getCurrencySymbol(h.currency)} {h.totalCost.toLocaleString()}
                              {h.costPerNight > 0 && (
                                <span className="text-gray-400 font-normal ml-1">
                                  ({getCurrencySymbol(h.currency)} {h.costPerNight.toLocaleString()}/{language === 'zh-TW' ? '晚' : 'night'})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          {h.link && (
                            <a href={h.link} target="_blank" rel="noopener noreferrer" className="btn text-xs">
                              {t.travel.link}
                            </a>
                          )}
                          <button onClick={() => openEditHotel(h)} className="btn text-xs">
                            {t.common.edit}
                          </button>
                          <button onClick={() => travel.deleteHotel(h.id)} className="btn-danger text-xs">
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Itinerary Outline */}
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.travel.dailyItinerary}
                </h3>
                <Link href="/travel/itinerary" className="btn-primary text-sm">
                  {t.travel.viewDetails}
                </Link>
              </div>

              <div className="space-y-2">
                {plan.dailyItineraries.map((day, index) => {
                  const dayTotalDuration = day.items.reduce(
                    (sum, item) => sum + item.estimatedDuration + item.travelTimeToNext,
                    0
                  );
                  const dayCost = day.items.reduce((sum, item) => {
                    if (item.type === 'hotel_checkin' || item.type === 'hotel_checkout' || item.type === 'flight_departure' || item.type === 'flight_arrival') return sum;
                    return sum + item.cost;
                  }, 0);

                  return (
                    <Link
                      key={day.id}
                      href={`/travel/itinerary?date=${day.date}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            D{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {day.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {day.date} | {day.items.length} {language === 'zh-TW' ? '個項目' : 'items'}
                              {dayTotalDuration > 0 && ` | ${formatDuration(dayTotalDuration)}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {dayCost > 0 && (
                            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                              {getCurrencySymbol(plan.defaultCurrency)} {dayCost.toLocaleString()}
                            </div>
                          )}
                          <span className="text-gray-400 text-lg">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Unconfirmed Attractions */}
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.travel.unconfirmedAttractions}
                  {plan.unconfirmedAttractions.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({plan.unconfirmedAttractions.length})
                    </span>
                  )}
                </h3>
                <button onClick={openNewAttraction} className="btn-primary text-sm">
                  {t.travel.addAttraction}
                </button>
              </div>

              {plan.unconfirmedAttractions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t.travel.noItems}</p>
              ) : (
                <div className="space-y-3">
                  {plan.unconfirmedAttractions.map(a => (
                    <div
                      key={a.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getCategoryIcon(a.category)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{a.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getCategoryLabel(a.category)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatDuration(a.estimatedDuration)}
                          {a.cost > 0 && (
                            <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                              {getCurrencySymbol(a.currency)} {a.cost.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {a.address && (
                          <div className="text-xs text-gray-400 mt-0.5">{a.address}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => openConfirmAttraction(a.id)}
                          className="btn-success text-xs"
                        >
                          {t.travel.confirmToDay}
                        </button>
                        <button onClick={() => openEditAttraction(a)} className="btn text-xs">
                          {t.common.edit}
                        </button>
                        <button onClick={() => travel.deleteUnconfirmedAttraction(a.id)} className="btn-danger text-xs">
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="card p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t.travel.costSummary}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.travel.flightsCost}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {travel.costSummary.flights.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.travel.hotelsCost}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {travel.costSummary.hotels.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.travel.attractionsCost}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {(travel.costSummary.attractions + travel.costSummary.itineraryItems).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.travel.totalExpenses}</div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {travel.costSummary.total.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* By currency breakdown */}
              {Object.keys(travel.costSummary.byCurrency).length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {language === 'zh-TW' ? '各幣別明細' : 'By Currency'}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(travel.costSummary.byCurrency).map(([currency, amount]) => (
                      <div key={currency} className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getCurrencySymbol(currency as TravelCurrency)} {amount.toLocaleString()}
                        </span>
                        <span className="text-gray-400 ml-1">{currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? t.travel.editPlan : t.travel.newPlan}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.planName}</label>
            <input
              type="text"
              className="input"
              placeholder={t.travel.planNamePlaceholder}
              value={planForm.name}
              onChange={e => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.travel.destination}</label>
            <input
              type="text"
              className="input"
              placeholder={t.travel.destinationPlaceholder}
              value={planForm.destination}
              onChange={e => setPlanForm(prev => ({ ...prev, destination: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.startDate}</label>
              <input
                type="date"
                className="input"
                value={planForm.startDate}
                onChange={e => setPlanForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.endDate}</label>
              <input
                type="date"
                className="input"
                value={planForm.endDate}
                onChange={e => setPlanForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">{t.travel.defaultCurrency}</label>
            <select
              className="select"
              value={planForm.defaultCurrency}
              onChange={e => setPlanForm(prev => ({ ...prev, defaultCurrency: e.target.value as TravelCurrency }))}
            >
              {TRAVEL_CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.symbol} {language === 'zh-TW' ? c.labelZh : c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              className="input"
              rows={2}
              value={planForm.notes}
              onChange={e => setPlanForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowPlanModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={savePlan} className="btn-primary">{t.common.save}</button>
          </div>
        </div>
      </Modal>

      {/* Flight Modal */}
      <Modal
        isOpen={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        title={editingFlight ? t.travel.editFlight : t.travel.addFlight}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.flightType}</label>
            <select
              className="select"
              value={flightForm.type}
              onChange={e => setFlightForm(prev => ({ ...prev, type: e.target.value as 'departure' | 'arrival' }))}
            >
              <option value="departure">{t.travel.departure}</option>
              <option value="arrival">{t.travel.arrival}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.date}</label>
              <input
                type="date"
                className="input"
                value={flightForm.date}
                onChange={e => setFlightForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.flightNumber}</label>
              <input
                type="text"
                className="input"
                placeholder={t.travel.flightNumberPlaceholder}
                value={flightForm.flightNumber}
                onChange={e => setFlightForm(prev => ({ ...prev, flightNumber: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">{t.travel.airline} ({t.common.optional})</label>
            <input
              type="text"
              className="input"
              value={flightForm.airline}
              onChange={e => setFlightForm(prev => ({ ...prev, airline: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.departureAirport}</label>
              <input
                type="text"
                className="input"
                placeholder="TPE"
                value={flightForm.departureAirport}
                onChange={e => setFlightForm(prev => ({ ...prev, departureAirport: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.arrivalAirport}</label>
              <input
                type="text"
                className="input"
                placeholder="NRT"
                value={flightForm.arrivalAirport}
                onChange={e => setFlightForm(prev => ({ ...prev, arrivalAirport: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.departureTime} ({t.common.optional})</label>
              <input
                type="time"
                className="input"
                value={flightForm.departureTime}
                onChange={e => setFlightForm(prev => ({ ...prev, departureTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.arrivalTime} ({t.common.optional})</label>
              <input
                type="time"
                className="input"
                value={flightForm.arrivalTime}
                onChange={e => setFlightForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.cost}</label>
              <input
                type="number"
                className="input"
                value={flightForm.cost || ''}
                onChange={e => setFlightForm(prev => ({ ...prev, cost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.common.currency}</label>
              <select
                className="select"
                value={flightForm.currency}
                onChange={e => setFlightForm(prev => ({ ...prev, currency: e.target.value as TravelCurrency }))}
              >
                {TRAVEL_CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              className="input"
              rows={2}
              value={flightForm.notes}
              onChange={e => setFlightForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowFlightModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={saveFlight} className="btn-primary">{t.common.save}</button>
          </div>
        </div>
      </Modal>

      {/* Hotel Modal */}
      <Modal
        isOpen={showHotelModal}
        onClose={() => setShowHotelModal(false)}
        title={editingHotel ? t.travel.editHotel : t.travel.addHotel}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.hotelName}</label>
            <input
              type="text"
              className="input"
              placeholder={t.travel.hotelNamePlaceholder}
              value={hotelForm.name}
              onChange={e => setHotelForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.checkIn}</label>
              <input
                type="date"
                className="input"
                value={hotelForm.checkInDate}
                onChange={e => {
                  const checkIn = e.target.value;
                  const nights = calculateNights(checkIn, hotelForm.checkOutDate);
                  setHotelForm(prev => ({
                    ...prev,
                    checkInDate: checkIn,
                    totalCost: prev.costPerNight > 0 ? prev.costPerNight * nights : prev.totalCost,
                  }));
                }}
              />
            </div>
            <div>
              <label className="label">{t.travel.checkOut}</label>
              <input
                type="date"
                className="input"
                value={hotelForm.checkOutDate}
                onChange={e => {
                  const checkOut = e.target.value;
                  const nights = calculateNights(hotelForm.checkInDate, checkOut);
                  setHotelForm(prev => ({
                    ...prev,
                    checkOutDate: checkOut,
                    totalCost: prev.costPerNight > 0 ? prev.costPerNight * nights : prev.totalCost,
                  }));
                }}
              />
            </div>
          </div>
          {hotelForm.checkInDate && hotelForm.checkOutDate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {calculateNights(hotelForm.checkInDate, hotelForm.checkOutDate)} {t.travel.nights}
            </div>
          )}
          <div>
            <label className="label">{t.travel.address} ({t.common.optional})</label>
            <input
              type="text"
              className="input"
              value={hotelForm.address}
              onChange={e => setHotelForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">{t.travel.costPerNight}</label>
              <input
                type="number"
                className="input"
                value={hotelForm.costPerNight || ''}
                onChange={e => {
                  const cpn = Number(e.target.value) || 0;
                  const nights = calculateNights(hotelForm.checkInDate, hotelForm.checkOutDate);
                  setHotelForm(prev => ({
                    ...prev,
                    costPerNight: cpn,
                    totalCost: cpn * nights,
                  }));
                }}
              />
            </div>
            <div>
              <label className="label">{t.travel.totalCost}</label>
              <input
                type="number"
                className="input"
                value={hotelForm.totalCost || ''}
                onChange={e => setHotelForm(prev => ({ ...prev, totalCost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.common.currency}</label>
              <select
                className="select"
                value={hotelForm.currency}
                onChange={e => setHotelForm(prev => ({ ...prev, currency: e.target.value as TravelCurrency }))}
              >
                {TRAVEL_CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.confirmationNumber} ({t.common.optional})</label>
              <input
                type="text"
                className="input"
                value={hotelForm.confirmationNumber}
                onChange={e => setHotelForm(prev => ({ ...prev, confirmationNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.phone} ({t.common.optional})</label>
              <input
                type="text"
                className="input"
                value={hotelForm.phone}
                onChange={e => setHotelForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">{t.travel.link} ({t.common.optional})</label>
            <input
              type="url"
              className="input"
              value={hotelForm.link}
              onChange={e => setHotelForm(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              className="input"
              rows={2}
              value={hotelForm.notes}
              onChange={e => setHotelForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowHotelModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={saveHotel} className="btn-primary">{t.common.save}</button>
          </div>
        </div>
      </Modal>

      {/* Attraction Modal */}
      <Modal
        isOpen={showAttractionModal}
        onClose={() => setShowAttractionModal(false)}
        title={editingAttraction ? t.travel.editAttraction : t.travel.addAttraction}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.attractionName}</label>
            <input
              type="text"
              className="input"
              value={attractionForm.name}
              onChange={e => setAttractionForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.travel.category}</label>
            <select
              className="select"
              value={attractionForm.category}
              onChange={e => setAttractionForm(prev => ({ ...prev, category: e.target.value as AttractionCategory }))}
            >
              {ATTRACTION_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.icon} {language === 'zh-TW' ? c.labelZh : c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t.travel.address} ({t.common.optional})</label>
            <input
              type="text"
              className="input"
              value={attractionForm.address}
              onChange={e => setAttractionForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.estimatedDuration}</label>
              <input
                type="number"
                className="input"
                value={attractionForm.estimatedDuration}
                onChange={e => setAttractionForm(prev => ({ ...prev, estimatedDuration: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.openingHours} ({t.common.optional})</label>
              <input
                type="text"
                className="input"
                placeholder="9:00-17:00"
                value={attractionForm.openingHours}
                onChange={e => setAttractionForm(prev => ({ ...prev, openingHours: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.cost}</label>
              <input
                type="number"
                className="input"
                value={attractionForm.cost || ''}
                onChange={e => setAttractionForm(prev => ({ ...prev, cost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.common.currency}</label>
              <select
                className="select"
                value={attractionForm.currency}
                onChange={e => setAttractionForm(prev => ({ ...prev, currency: e.target.value as TravelCurrency }))}
              >
                {TRAVEL_CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t.travel.link} ({t.common.optional})</label>
            <input
              type="url"
              className="input"
              value={attractionForm.link}
              onChange={e => setAttractionForm(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              className="input"
              rows={2}
              value={attractionForm.notes}
              onChange={e => setAttractionForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAttractionModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={saveAttraction} className="btn-primary">{t.common.save}</button>
          </div>
        </div>
      </Modal>

      {/* Confirm to Day Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t.travel.confirmToDay}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.selectDay}</label>
            <select
              className="select"
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
            >
              {plan?.dailyItineraries.map((day, index) => (
                <option key={day.id} value={day.date}>
                  Day {index + 1} - {day.date} ({day.title})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowConfirmModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={handleConfirmAttraction} className="btn-primary">{t.common.confirm}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
