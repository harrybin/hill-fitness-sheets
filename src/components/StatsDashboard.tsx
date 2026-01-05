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

  const freqData = Object.entries(monthlyFreq)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      label: month.slice(5, 7) + "/" + month.slice(2, 4),
      value,
    }));

  // Dropdown für Übungsauswahl (Volumen-Chart)
  const [selectedEx, setSelectedEx] = useState(() => exercises[0]?.id || "");
  const selectedExercise =
    exercises.find((e) => e.id === selectedEx) || exercises[0];
  const selectedVol = selectedExercise
    ? volumeHistory[selectedExercise.id] || []
    : [];

  return (
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
          {/* Auswahl und Export unterhalb des Graphen */}
          <div className="mt-2">
            <select
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              value={selectedEx}
              onChange={(e) => setSelectedEx(e.target.value)}
              aria-label="Übung wählen"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
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
          {progression[selectedExercise?.id]?.length > 1 && (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => setModal({ type: "prog", ex: selectedExercise })}
            >
              <AnimatedLineChart
                data={progression[selectedExercise.id].map((p) => ({
                  label: p.date.slice(5, 7) + "/" + p.date.slice(2, 4),
                  value: p.maxWeight,
                }))}
                color="#10b981"
              />
            </div>
          )}
          {/* Auswahl und Export unterhalb des Graphen */}
          <div className="mt-2">
            <select
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
              value={selectedEx}
              onChange={(e) => setSelectedEx(e.target.value)}
              aria-label="Übung wählen für Fortschritt"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
      {/* Modal für Rohdatenanzeige */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="my-4 border-t border-border" />
            <DialogTitle>
              {modal?.type === "vol" ? "Volumen-Daten" : "Fortschritt-Daten"} –{" "}
              {modal?.ex?.name}
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
                  (volumeHistory[modal.ex.id] || []).map((v, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{v.date}</td>
                      <td className="border px-2 py-1">{v.volume}</td>
                    </tr>
                  ))}
                {modal &&
                  modal.type === "prog" &&
                  (progression[modal.ex.id] || []).map((p, i) => (
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
  );
};
