import { Shock } from "@/lib/types";
import { Slider } from "./ui/slider";
import {
  ArrowLeftIcon,
  ArrowLeftToLineIcon,
  ArrowRightIcon,
  ArrowRightToLineIcon,
  AudioWaveformIcon,
  BatteryChargingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InfoIcon,
  TriangleRightIcon,
} from "lucide-react";
import Repeatable from "react-repeatable";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ZapPanel({
  currentShock,
  setCurrentShock,
}: {
  currentShock: Shock;
  setCurrentShock: (shock: Shock) => void;
}) {
  return (
    <div className="space-y-2">
      <SpecificSlider
        label="Power"
        icon={<BatteryChargingIcon />}
        unit="%"
        value={currentShock.intensity}
        setValue={(val) => setCurrentShock({ ...currentShock, intensity: val })}
        min={0}
        max={100}
        smallStep={1}
        bigStep={10}
      />
      <SpecificSlider
        label="Duration"
        icon={<ClockIcon />}
        tooltip="Time spent at maximum power"
        unit="s"
        value={Math.round(currentShock.duration / 100) / 10}
        setValue={(val) =>
          setCurrentShock({
            ...currentShock,
            duration: Math.round(val * 10) * 100,
          })
        }
        min={0}
        max={10}
        undefinedMax
        smallStep={0.1}
        bigStep={1}
      />
      <SpecificSlider
        label="Frequency"
        icon={<AudioWaveformIcon />}
        unit="Hz"
        value={currentShock.frequency || 10}
        setValue={(val) => setCurrentShock({ ...currentShock, frequency: val })}
        min={10}
        max={100}
        smallStep={1}
        bigStep={10}
      />
      <SpecificSlider
        label="Ramp Time"
        icon={<TriangleRightIcon />}
        tooltip="Time before/after the full power is reached"
        unit="s"
        value={Math.round(currentShock.rampTime / 100) / 10}
        setValue={(val) =>
          setCurrentShock({
            ...currentShock,
            rampTime: Math.round(val * 10) * 100,
          })
        }
        min={0}
        max={5}
        undefinedMax
        smallStep={0.1}
        bigStep={1}
      />
    </div>
  );
}

function SpecificSlider({
  label,
  icon,
  unit,
  value,
  setValue,
  disabled,
  tooltip,

  min,
  max,
  smallStep,
  bigStep,
  undefinedMax = false,
}: {
  label: string;
  icon: React.ReactNode;
  unit: string;
  value: number;
  setValue: (val: number) => void;
  disabled?: boolean;
  tooltip?: string;

  min: number;
  max: number;
  smallStep: number;
  bigStep: number;
  undefinedMax?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value.toString());

  const onInputSave = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(
        Math.min(undefinedMax ? Infinity : max, parsed),
        min
      );

      setValue(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex flex-row w-full items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          {icon} {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger
                className="inline-block text-muted-foreground"
                aria-label={`${label} info`}
              >
                <InfoIcon size={20} />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-muted-foreground flex flex-row items-center">
          <input
            type="text"
            className="w-16 text-right border border-transparent bg-transparent py-1 focus:outline-none rounded focus:border-blue-500 transition-all pr-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={onInputSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onInputSave();
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
            aria-label={`${label} value`}
          />
          <span>{unit}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val: number[]) => setValue(val[0])}
        disabled={disabled}
        min={min}
        max={max}
        step={smallStep}
        aria-label={label}
      />
      <div className="flex flex-row items-center justify-between pt-1">
        <div className="flex flex-row items-center">
          <Button
            variant="outline"
            className="rounded-r-none"
            onClick={() => setValue(min)}
            disabled={value <= min || disabled}
            size="sm"
            aria-label="Reset to Minimum"
          >
            <ArrowLeftToLineIcon />
          </Button>
          <Repeatable
            repeatDelay={500}
            repeatInterval={100}
            onPress={() => setValue(Math.max(min, value - bigStep))}
            onHold={() => setValue(Math.max(min, value - bigStep))}
          >
            <Button
              variant="outline"
              className="rounded-none"
              disabled={value <= min || disabled}
              size="sm"
              aria-label="Decrease by Large Step"
            >
              <ArrowLeftIcon />
            </Button>
          </Repeatable>
          <Repeatable
            repeatDelay={500}
            repeatInterval={100}
            onPress={() => setValue(Math.max(min, value - smallStep))}
            onHold={() => setValue(Math.max(min, value - smallStep))}
          >
            <Button
              variant="outline"
              className="rounded-l-none"
              disabled={value <= min || disabled}
              size="sm"
              aria-label="Decrease by Small Step"
            >
              <ChevronLeftIcon />
            </Button>
          </Repeatable>
        </div>
        <div className="flex flex-row items-center">
          <Repeatable
            repeatDelay={500}
            repeatInterval={100}
            onPress={() => setValue(Math.min(max, value + smallStep))}
            onHold={() => setValue(Math.min(max, value + smallStep))}
          >
            <Button
              variant="outline"
              className="rounded-r-none"
              disabled={value >= max || disabled}
              size="sm"
              aria-label="Increase by Small Step"
            >
              <ChevronRightIcon />
            </Button>
          </Repeatable>
          <Repeatable
            repeatDelay={500}
            repeatInterval={100}
            onPress={() => setValue(Math.min(max, value + bigStep))}
            onHold={() => setValue(Math.min(max, value + bigStep))}
          >
            <Button
              variant="outline"
              className="rounded-none"
              disabled={value >= max || disabled}
              size="sm"
              aria-label="Increase by Large Step"
            >
              <ArrowRightIcon />
            </Button>
          </Repeatable>
          <Button
            variant="outline"
            className="rounded-l-none"
            onClick={() => setValue(max)}
            disabled={value >= max || disabled}
            size="sm"
            aria-label="Set to Maximum"
          >
            <ArrowRightToLineIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
