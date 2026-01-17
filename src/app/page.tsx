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
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

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

interface EnergyUsageData {
  name: string;
  class: string;
  voltage: number;
  electronics: Electronic[];
}

// Generate time options: 30 menit, kemudian 1 jam, 2 jam, 3 jam, ...
const timeOptions: TimeOption[] = [
  { label: "30 Menit", value: 0.5 }, // Khusus 30 menit di awal
];

// Lalu tambahkan 1 jam sampai 24 jam
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

const classOptions = ["10A", "10B", "11A", "11B", "12A", "12B"] as const;

export default function Home() {
  const [name, setName] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [electronics, setElectronics] = useState<Electronic[]>([
    { type: "", power: 0, time: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    value: string | number
  ) => {
    setElectronics((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validasi manual tanpa alert bawaan browser
      if (!name.trim()) {
        alert("Nama harus diisi");
        setIsSubmitting(false);
        return;
      }

      if (!className) {
        alert("Kelas harus dipilih");
        setIsSubmitting(false);
        return;
      }

      if (!voltage) {
        alert("Daya listrik harus dipilih");
        setIsSubmitting(false);
        return;
      }

      // Validasi electronics - hanya yang terisi
      const filledElectronics = electronics.filter(
        (item) => item.type.trim() || item.power > 0 || item.time > 0
      );

      // Cek jika ada item yang terisi sebagian (tidak lengkap)
      for (let i = 0; i < electronics.length; i++) {
        const item = electronics[i];
        const hasAnyData = item.type.trim() || item.power > 0 || item.time > 0;

        if (hasAnyData) {
          // Jika ada data, pastikan semua field terisi
          if (!item.type.trim()) {
            alert(`Jenis elektronik item ${i + 1} harus diisi`);
            setIsSubmitting(false);
            return;
          }

          if (!item.power || item.power <= 0) {
            alert(`Daya elektronik item ${i + 1} harus lebih dari 0`);
            setIsSubmitting(false);
            return;
          }

          if (!item.time || item.time <= 0) {
            alert(`Lama penggunaan item ${i + 1} harus dipilih`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Pastikan minimal ada 1 elektronik yang terisi lengkap
      if (filledElectronics.length === 0) {
        alert("Minimal harus ada 1 item elektronik yang diisi");
        setIsSubmitting(false);
        return;
      }

      const data: EnergyUsageData = {
        name: name.trim(),
        class: className,
        voltage: Number(voltage),
        electronics: electronics
          .filter((item) => item.type.trim() && item.power > 0 && item.time > 0)
          .map((item) => ({
            type: item.type.trim(),
            power: Number(item.power),
            time: Number(item.time),
          })),
      };

      const { error } = await supabase.from("energy_usage").insert([data]);

      if (error) {
        throw error;
      }

      alert("Data berhasil disimpan!");

      // Reset form
      setName("");
      setClassName("");
      setVoltage("");
      setElectronics([{ type: "", power: 0, time: 0 }]);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Data Konsumsi Listrik</CardTitle>
        <CardDescription className="-mt-2">
          Masukkan data konsumsi listrik Anda di bawah ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
