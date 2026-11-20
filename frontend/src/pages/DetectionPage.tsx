import React, { useState, useEffect } from "react";
import {
  Eye,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Cpu,
  Clock,
  MapPin,
  Crosshair,
  BarChart2,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useFleetStore } from "../store/fleetStore";
import { api } from "../api/client";
import { DetectionAnalysisResult } from "../types";

export const DetectionPage: React.FC = () => {
  const drones = useFleetStore((s) => s.drones);
  const flyTo = useFleetStore((s) => s.flyTo);

  const [selectedDroneId, setSelectedDroneId] = useState<string>("DRONE-01");
  const [samples, setSamples] = useState<{ id: string; name: string; path: string }[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [forceMock, setForceMock] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionAnalysisResult | null>(null);

  const droneList = Object.values(drones);

  // Fetch sample images on mount
  useEffect(() => {
    api.detections.getSamples().then((res) => {
      if (res.samples && res.samples.length > 0) {
        setSamples(res.samples);
        setSelectedSample(res.samples[0].id);
        setPreviewUrl(res.samples[0].path);
      }
    });
  }, []);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    setUploadedFile(null);
    const found = samples.find((s) => s.id === sampleId);
    if (found) {
      setPreviewUrl(found.path);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSelectedSample("");
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    if (selectedDroneId) {
      formData.append("drone_id", selectedDroneId);
    }
    formData.append("force_mock", String(forceMock));

    if (uploadedFile) {
      formData.append("file", uploadedFile);
    } else if (selectedSample) {
      formData.append("sample_filename", selectedSample);
    }

    try {
      const res = await api.detections.analyze(formData);
      setResult(res);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = result
    ? Object.entries(result.counts_by_class).map(([cls, count]) => ({
        class: cls.toUpperCase(),
        count,
      }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-violet-400" />
            AI Drone Aerial Object Detection & Geotagging
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ultralytics YOLOv8 inference, camera GSD projective mapping & automated real-world lat/lon geotagging
          </p>
        </div>

        {/* Mock Badge indicator */}
        {result?.is_mock && (
          <Badge variant="amber" size="md" dot>
            MOCK MODE ACTIVE
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (Left) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Drone Selection */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" /> Sensor Context Drone
              </span>
              <span className="text-[10px] text-slate-400 font-mono">GSD MODEL</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-sans">
                Select Drone to project aerial camera coordinates:
              </label>
              <select
                value={selectedDroneId}
                onChange={(e) => setSelectedDroneId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none"
              >
                {droneList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id}) - Alt: {Math.round(d.altitude)}m
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* 2. Sample Aerial Images Picker */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" /> Bundled Sample Imagery
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">READY</span>
            </div>

            <div className="space-y-2">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedSample === sample.id
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold"
                      : "bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs">{sample.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>

            {/* Custom File Upload Option */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="text-xs text-slate-400 block font-sans">
                Or upload custom aerial photo:
              </label>
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/15 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-xs text-slate-300">
                  {uploadedFile ? uploadedFile.name : "Click to select JPG / PNG"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Run Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isAnalyzing}
              onClick={handleAnalyze}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Run AI Detection & Geotag
            </Button>
          </Card>
        </div>

        {/* Image & Detections Display Column (Right) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Image Canvas View */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                {result ? "Annotated AI Detection Canvas" : "Selected Aerial Source"}
              </span>
              {result && (
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Clock className="w-3.5 h-3.5" />
                    {result.processing_time_ms} ms
                  </span>
                  <span>&bull;</span>
                  <span className="text-white font-bold">
                    {result.detections.length} Objects Detected
                  </span>
                </div>
              )}
            </div>

            {/* Image Box */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center min-h-[380px]">
              {previewUrl ? (
                <img
                  src={result ? result.annotated_image_url : previewUrl}
                  alt="Aerial Drone Surveillance"
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              ) : (
                <div className="text-center text-slate-500 py-16 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm">Select a sample image or upload to inspect</p>
                </div>
              )}
            </div>
          </Card>

          {/* Detections Breakdown & Class Frequency */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Counts Chart */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-400" /> Detected Classes
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="class" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0B1220",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Geotagged Object List */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" /> Geotagged Real-World GPS
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {result.detections.map((det, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="uppercase text-cyan-300">{det.class_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {Math.round(det.confidence * 100)}% conf
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          GPS: {det.latitude.toFixed(5)}, {det.longitude.toFixed(5)}
                        </div>
                      </div>
                      <button
                        onClick={() => flyTo(det.latitude, det.longitude, 17)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Map &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
