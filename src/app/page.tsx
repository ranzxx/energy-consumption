"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Type definitions
interface Electronic {
  type: string;
  power: number;
  time: number;
}

interface TimeOption {
  label: string;
  value: number;
}

interface CalculationResult {
  totalWh: number;
  totalKwh: number;
  tarif: number;
  totalCost: number;
  monthlyCost: number;
}

// Generate time options: 30 menit, kemudian 1 jam, 2 jam, 3 jam, ...
const timeOptions: TimeOption[] = [{ label: "30 Menit", value: 0.5 }];

for (let i = 1; i <= 24; i++) {
  timeOptions.push({ label: `${i} Jam`, value: i });
}

// Daftar pilihan daya listrik sesuai PLN
const voltageOptions = [
  { label: "900 VA (Subsidi)", value: "900" },
  { label: "900 VA (Non-Subsidi)", value: "900(non-subsidi)" },
  { label: "1300-2200 VA", value: "1300" },
  { label: "3500-5500 VA", value: "3500" },
  { label: ">6600 VA", value: "6600" },
];

// Tarif listrik per kWh (dalam rupiah) - sesuaikan dengan tarif PLN terbaru
const tarifListrik: { [key: string]: number } = {
  "900": 1352, // 900 VA subsidi
  "900(non-subsidi)": 1444.7, // 900 VA non-subsidi
  "1300": 1444.7, // 1300-2200 VA
  "3500": 1699.53, // 3500-5500 VA
  "6600": 1699.53, // >6600 VA
};

const classOptions = ["10A", "10B", "11A", "11B", "12A", "12B"] as const;

export default function Home() {
  const [name, setName] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [electronics, setElectronics] = useState<Electronic[]>([
    { type: "", power: 0, time: 0 },
  ]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const addItem = () => {
    if (electronics.length >= 10) {
      alert("Maksimal 10 item elektronik");
      return;
    }
    setElectronics((prev) => [...prev, { type: "", power: 0, time: 0 }]);
  };

  const removeItem = (index: number) => {
    if (electronics.length === 1) {
      alert("Minimal harus ada 1 item elektronik");
      return;
    }
    setElectronics((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof Electronic,
    value: string | number,
  ) => {
    setElectronics((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const calculateEnergy = (electronics: Electronic[], voltageKey: string) => {
    // Total konsumsi energi dalam Wh (Watt-hour)
    const totalWh = electronics.reduce((total, item) => {
      return total + item.power * item.time;
    }, 0);

    // Konversi ke kWh
    const totalKwh = totalWh / 1000;

    // Dapatkan tarif berdasarkan voltage
    const tarif = tarifListrik[voltageKey] || 0;

    // Hitung total biaya per hari
    const totalCost = (totalWh * tarif) / 1000;

    // Hitung biaya per bulan (30 hari)
    const monthlyCost = totalCost * 30;

    return {
      totalWh,
      totalKwh,
      tarif,
      totalCost,
      monthlyCost,
    };
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    // Validasi
    if (!name.trim()) {
      alert("Nama harus diisi");
      setIsCalculating(false);
      return;
    }

    if (!className) {
      alert("Kelas harus dipilih");
      setIsCalculating(false);
      return;
    }

    if (!voltage) {
      alert("Daya listrik harus dipilih");
      setIsCalculating(false);
      return;
    }

    // Validasi electronics - hanya yang terisi
    const filledElectronics = electronics.filter(
      (item) => item.type.trim() || item.power > 0 || item.time > 0,
    );

    // Cek jika ada item yang terisi sebagian (tidak lengkap)
    for (let i = 0; i < electronics.length; i++) {
      const item = electronics[i];
      const hasAnyData = item.type.trim() || item.power > 0 || item.time > 0;

      if (hasAnyData) {
        if (!item.type.trim()) {
          alert(`Jenis elektronik item ${i + 1} harus diisi`);
          setIsCalculating(false);
          return;
        }

        if (!item.power || item.power <= 0) {
          alert(`Daya elektronik item ${i + 1} harus lebih dari 0`);
          setIsCalculating(false);
          return;
        }

        if (!item.time || item.time <= 0) {
          alert(`Lama penggunaan item ${i + 1} harus dipilih`);
          setIsCalculating(false);
          return;
        }
      }
    }

    // Pastikan minimal ada 1 elektronik yang terisi lengkap
    if (filledElectronics.length === 0) {
      alert("Minimal harus ada 1 item elektronik yang diisi");
      setIsCalculating(false);
      return;
    }

    const validElectronics = electronics
      .filter((item) => item.type.trim() && item.power > 0 && item.time > 0)
      .map((item) => ({
        type: item.type.trim(),
        power: Number(item.power),
        time: Number(item.time),
      }));

    // Hitung hasil
    const calculation = calculateEnergy(validElectronics, voltage);
    setResult(calculation);

    setIsCalculating(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Konsumsi Listrik</CardTitle>
          <CardDescription className="-mt-2">
            Masukkan data konsumsi listrik Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="class">Kelas</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="voltage">Tegangan Listrik</Label>
              <Select value={voltage} onValueChange={setVoltage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tegangan Listrik" />
                </SelectTrigger>
                <SelectContent>
                  {voltageOptions.map((option, index) => (
                    <SelectItem key={index} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Daftar Elektronik</Label>
              {electronics.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2"
                >
                  <Input
                    type="text"
                    placeholder="Jenis Elektronik"
                    value={item.type}
                    onChange={(e) => updateItem(index, "type", e.target.value)}
                  />

                  <Input
                    type="number"
                    placeholder="Daya (Watt)"
                    value={item.power || ""}
                    onChange={(e) =>
                      updateItem(index, "power", Number(e.target.value))
                    }
                    min="1"
                    step="1"
                  />

                  <Select
                    value={item.time ? String(item.time) : ""}
                    onValueChange={(val) =>
                      updateItem(index, "time", Number(val))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Lama Penggunaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {electronics.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-10"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center">
              <Button
                type="button"
                onClick={addItem}
                disabled={electronics.length >= 10}
                variant="outline"
                className="w-full sm:w-auto"
              >
                + Tambah Item
              </Button>
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full"
              disabled={isCalculating}
            >
              {isCalculating ? "Menghitung..." : "Hitung"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              Hasil Perhitungan
            </CardTitle>
            <CardDescription className="-mt-2 text-green-700">
              Estimasi konsumsi dan biaya listrik Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-1">
                Rumus perhitungan:
              </p>
              <p className="text-gray-600 font-mono text-xs bg-white p-2 rounded">
                Total Watt × Lama Penggunaan (jam) = Total Wh
                <br />
                (Total Wh × Tarif) / 1000 = Biaya Listrik per Hari
                <br />
                Biaya per Hari × 30 = Biaya per Bulan
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Total Konsumsi Energi:
                </span>
                <span className="text-lg font-bold text-green-700">
                  {result.totalKwh.toFixed(2)} kWh
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Tarif per kWh:
                </span>
                <span className="text-lg font-bold text-green-700">
                  Rp {result.tarif.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                <span className="text-sm font-medium text-blue-800">
                  Biaya Listrik per Hari:
                </span>
                <span className="text-xl font-bold text-blue-800">
                  Rp{" "}
                  {result.totalCost.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-300">
                <span className="text-sm font-medium text-green-800">
                  Biaya Listrik per Bulan (30 hari):
                </span>
                <span className="text-xl font-bold text-green-800">
                  Rp{" "}
                  {result.monthlyCost.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}