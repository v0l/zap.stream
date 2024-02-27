import { forwardRef } from "react";
import AsyncButton, { AsyncButtonProps } from "./async-button";
import { Icon } from "./icon";
import classNames from "classnames";

export const DefaultButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-white text-black")}
      ref={ref}
    />
  );
});
export const PrimaryButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-primary")}
      ref={ref}
    />
  );
});
export const Layer1Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-layer-1")}
      ref={ref}
    />
  );
});
export const Layer2Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-layer-2")}
      ref={ref}
    />
  );
});
export const Layer3Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-layer-3")}
      ref={ref}
    />
  );
});
export const WarningButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl bg-warning")}
      ref={ref}
    />
  );
});
export const IconButton = forwardRef<HTMLButtonElement, { iconName: string; iconSize?: number } & AsyncButtonProps>(
  ({ iconName, iconSize, ...props }: { iconName: string; iconSize?: number } & AsyncButtonProps, ref) => {
    return (
      <AsyncButton {...props} className={classNames(props.className)} ref={ref}>
        <Icon name={iconName} size={iconSize} />
      </AsyncButton>
    );
  }
);
export const BorderButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, "px-3 py-2 font-semibold rounded-xl btn-border")}
      ref={ref}
    />
  );
});
