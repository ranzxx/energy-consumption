"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { FormEvent, useState } from "react";
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

const timeOptions: TimeOption[] = Array.from({ length: 24 }, (_, i) => ({
  label: `${i + 1} Jam`,
  value: i + 1,
}));

export default function Home() {
  const classOptions = ["10A", "10B", "11A", "11B", "12A", "12B"];

  const [name, setName] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [voltage, setVoltage] = useState<string>("");
  const [electronics, setElectronics] = useState<Electronic[]>([
    { type: "", power: 0, time: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const addItem = () => {
    if (electronics.length >= 5) return;
    setElectronics((prev) => [...prev, { type: "", power: 0, time: 0 }]);
  };

  const removeItem = (index: number) => {
    if (electronics.length === 1) return;
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
      // Validasi data
      if (!name.trim() || !className || !voltage) {
        alert("Mohon lengkapi semua field yang diperlukan");
        setIsSubmitting(false);
        return;
      }

      // Validasi electronics
      const isElectronicsValid = electronics.every(
        (item) => item.type.trim() && item.power > 0 && item.time > 0
      );

      if (!isElectronicsValid) {
        alert("Mohon lengkapi semua data elektronik dengan benar");
        setIsSubmitting(false);
        return;
      }

      const data: EnergyUsageData = {
        name: name.trim(),
        class: className,
        voltage: Number(voltage),
        electronics: electronics.map((item) => ({
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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg">Data Konsumsi Listrik</CardTitle>
        <CardDescription className="-mt-2">
          Masukkan data konsumsi listrik Anda di bawah ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="class">Kelas</Label>
              <Select value={className} onValueChange={setClassName} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose Your Class" />
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
            <Label htmlFor="voltage">Total Daya Listrik</Label>
            <div className="flex">
              <Input
                id="voltage"
                name="voltage"
                type="number"
                placeholder="Voltage"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
                required
                min="0"
                className="rounded-r-none"
              />
              <div className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                Volt
              </div>
            </div>
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
                  required
                />

                <Input
                  type="number"
                  placeholder="Daya (Watt)"
                  value={item.power || ""}
                  onChange={(e) =>
                    updateItem(index, "power", Number(e.target.value))
                  }
                  required
                  min="0"
                  step="0.01"
                />

                <Select
                  value={item.time ? String(item.time) : ""}
                  onValueChange={(val) =>
                    updateItem(index, "time", Number(val))
                  }
                  required
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
              disabled={electronics.length >= 5}
              variant="outline"
              className="w-full sm:w-auto"
            >
              + Tambah Item
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Submit"}
          </Button>

          {/* {electronics.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                {index === 0 && (
                  <Label htmlFor="electronic_type">Jenis Elektronik</Label>
                )}
                <Input
                  id="electronic_type"
                  name="electronic_type"
                  type="text"
                  placeholder="Electronic Type"
                  required
                  onChange={(e) => updateItem(index, "type", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                {index === 0 && <Label htmlFor="power">Besar Daya</Label>}
                <Input
                  id="power"
                  name="power"
                  type="text"
                  placeholder="Power Usage"
                  required
                  onChange={(e) =>
                    updateItem(index, "power", Number(e.target.value))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                {index === 0 && (
                  <Label htmlFor="select3">Lama Penggunaan</Label>
                )}
                <Select
                  onValueChange={(val) =>
                    updateItem(index, "time", Number(val))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Time Usage" />
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
              </div>
            </div>
          ))} */}
          {/* <div className="flex justify-center items-center">
            <Button
              type="button"
              onClick={addItem}
              disabled={electronics.length >= 5}
              className="bg-black text-white"
            >
              + Add Item
            </Button>
          </div> */}
          {/* <Button type="submit" className="w-full">
            Submit
          </Button> */}
        </form>
      </CardContent>
    </Card>
  );
}
