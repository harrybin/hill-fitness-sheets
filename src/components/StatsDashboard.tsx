import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMonthlyTrainingFrequency,
  getExercisePRs,
  getExerciseVolumeHistory,
  getExerciseProgression,
} from "../lib/utils";
import { BarChart } from "./BarChart";
import { AnimatedLineChart } from "./AnimatedLineChart";
import type { Session, Exercise } from "../lib/types";

interface StatsDashboardProps {
  sessions: Session[];
  exercises: Exercise[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  sessions,
  exercises,
}) => {
  // Modal-Dialog für Rohdatenanzeige
  const [modal, setModal] = useState<null | {
    type: "vol" | "prog";
    ex: Exercise;
  }>(null);
  const monthlyFreq = getMonthlyTrainingFrequency(sessions);
  const prs = getExercisePRs(sessions);
  const volumeHistory = getExerciseVolumeHistory(sessions);
  const progression = getExerciseProgression(sessions);

  // Aggregierte Volumen-Daten (Summe/Durchschnitt)
  const allVolumeHistory = Object.values(volumeHistory);
  const sumVolumeHistory: { date: string; volume: number }[] = [];
  const avgVolumeHistory: { date: string; volume: number }[] = [];
  if (allVolumeHistory.length > 0) {
    // Alle Einträge nach Datum gruppieren
    const byDate: Record<string, number[]> = {};
    allVolumeHistory.forEach((exArr) => {
      exArr.forEach(({ date, volume }) => {
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(volume);
      });
    });
    Object.entries(byDate).forEach(([date, volumes]) => {
      sumVolumeHistory.push({
        date,
        volume: volumes.reduce((a, b) => a + b, 0),
      });
      avgVolumeHistory.push({
        date,
        volume: Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length),
      });
    });
    // Nach Datum sortieren
    sumVolumeHistory.sort((a, b) => a.date.localeCompare(b.date));
    avgVolumeHistory.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Aggregierte Progression-Daten (Summe/Durchschnitt)
  const allProgression = Object.values(progression);
  const sumProgression: { date: string; maxWeight: number }[] = [];
  const avgProgression: { date: string; maxWeight: number }[] = [];
  if (allProgression.length > 0) {
    const byDate: Record<string, number[]> = {};
    allProgression.forEach((exArr) => {
      exArr.forEach(({ date, maxWeight }) => {
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(maxWeight);
      });
    });
    Object.entries(byDate).forEach(([date, weights]) => {
      sumProgression.push({
        date,
        maxWeight: weights.reduce((a, b) => a + b, 0),
      });
      avgProgression.push({
        date,
        maxWeight: Math.round(
          weights.reduce((a, b) => a + b, 0) / weights.length
        ),
      });
    });
    sumProgression.sort((a, b) => a.date.localeCompare(b.date));
    avgProgression.sort((a, b) => a.date.localeCompare(b.date));
  }

  const freqData = Object.entries(monthlyFreq)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      label: month.slice(5, 7) + "/" + month.slice(2, 4),
      value,
    }));

  // Dropdown für Übungsauswahl inkl. Summe/Durchschnitt
  type ExSelector = string;
  const SUM_KEY = "__sum__";
  const AVG_KEY = "__avg__";
  const selectorOptions = [
    { id: SUM_KEY, name: "SUMME (alle Übungen)" },
    { id: AVG_KEY, name: "DURCHSCHNITT (alle Übungen)" },
    ...exercises.map((ex) => ({ id: ex.id, name: ex.name })),
  ];
  const [selectedEx, setSelectedEx] = useState<ExSelector>(
    () => selectorOptions[0]?.id || ""
  );
  const selectedExercise =
    exercises.find((e) => e.id === selectedEx) || exercises[0];
  let selectedVol: { date: string; volume: number }[] = [];
  if (selectedEx === SUM_KEY) selectedVol = sumVolumeHistory;
  else if (selectedEx === AVG_KEY) selectedVol = avgVolumeHistory;
  else
    selectedVol = selectedExercise
      ? volumeHistory[selectedExercise.id] || []
      : [];

  let selectedProg: { date: string; maxWeight: number }[] = [];
  if (selectedEx === SUM_KEY) selectedProg = sumProgression;
  else if (selectedEx === AVG_KEY) selectedProg = avgProgression;
  else
    selectedProg = selectedExercise
      ? progression[selectedExercise.id]?.map(({ date, maxWeight }) => ({
          date,
          maxWeight,
        })) || []
      : [];

  return (
    <>
      <div className="p-4 space-y-6">
        <section>
          <h3 className="font-semibold mb-2">
            Trainingshäufigkeit
            <span className="text-xs text-muted-foreground align-middle ml-5">
              (# Tainings / Monat)
            </span>
          </h3>
          <div className="w-full max-w-xs mx-auto">
            <BarChart data={freqData} />
          </div>
        </section>
        <div className="my-4 border-t border-border" /> {/*Divider */}
        <section>
          <h3 className="font-semibold mb-2">
            Trainingsvolumen Verlauf{" "}
            <span className="text-xs text-muted-foreground align-middle ml-5">
              (Σ&nbsp;(Gewicht&nbsp;×&nbsp;Wiederholungen))
            </span>
          </h3>
          <div className="w-full max-w-xs mx-auto mb-2">
            {/* Graph oben */}
            {selectedVol.length > 1 && (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setModal({ type: "vol", ex: selectedExercise })}
              >
                <AnimatedLineChart
                  data={selectedVol.map((v) => ({
                    label: v.date.slice(5, 7) + "/" + v.date.slice(2, 4),
                    value: v.volume,
                  }))}
                />
              </div>
            )}
          </div>
        </section>
        <div className="my-4 border-t border-border" /> {/*Divider */}
        <section>
          <h3 className="font-semibold mb-2">
            Fortschritt
            <span className="text-xs text-muted-foreground align-middle ml-5">
              (max&nbsp;Gewicht&nbsp;pro&nbsp;Einheit)
            </span>
          </h3>
          <div className="w-full max-w-xs mx-auto mb-2">
            {/* Graph oben */}
            {selectedProg.length > 1 && (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setModal({ type: "prog", ex: selectedExercise })}
              >
                <AnimatedLineChart
                  data={selectedProg.map((p) => ({
                    label: p.date.slice(5, 7) + "/" + p.date.slice(2, 4),
                    value: p.maxWeight,
                  }))}
                  color="#10b981"
                />
              </div>
            )}
          </div>
        </section>
        <div className="my-4 border-t border-border" /> {/*Divider */}
        {/* Auswahl und Export unterhalb des Graphen */}
        <div className="mt-2">
          <select
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
            value={selectedEx}
            onChange={(e) => setSelectedEx(e.target.value)}
            aria-label="Übung wählen für Fortschritt"
          >
            {selectorOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        {/* Modal für Rohdatenanzeige */}
        <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="my-4 border-t border-border" />
              <DialogTitle>
                {modal?.type === "vol" ? "Volumen-Daten" : "Fortschritt-Daten"}{" "}
                – {modal?.ex?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Datum</th>
                    <th className="border px-2 py-1">
                      {modal?.type === "vol" ? "Volumen" : "Max Gewicht"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modal &&
                    modal.type === "vol" &&
                    (modal.ex.id === SUM_KEY
                      ? sumVolumeHistory
                      : modal.ex.id === AVG_KEY
                      ? avgVolumeHistory
                      : volumeHistory[modal.ex.id] || []
                    ).map((v, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{v.date}</td>
                        <td className="border px-2 py-1">{v.volume}</td>
                      </tr>
                    ))}
                  {modal &&
                    modal.type === "prog" &&
                    (modal.ex.id === SUM_KEY
                      ? sumProgression
                      : modal.ex.id === AVG_KEY
                      ? avgProgression
                      : progression[modal.ex.id] || []
                    ).map((p, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{p.date}</td>
                        <td className="border px-2 py-1">{p.maxWeight}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
