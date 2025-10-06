declare module "react-repeatable" {
    import * as React from "react";
    export interface RepeatableProps {
        repeatDelay: number;
        repeatInterval: number;
        onPress?: (event: React.MouseEvent | React.TouchEvent) => void;
        onHoldStart?: () => void;
        onHold?: () => void;
        onHoldEnd?: () => void;
        onRelease?: (event: React.MouseEvent | React.TouchEvent) => void;
        children: React.ReactNode;
    }

    const Repeatable: React.ComponentType<RepeatableProps>;
    export default Repeatable;
}
