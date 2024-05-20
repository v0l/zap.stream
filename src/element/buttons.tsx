import { forwardRef } from "react";
import AsyncButton, { AsyncButtonProps } from "./async-button";
import { Icon } from "./icon";
import classNames from "classnames";

const buttonBaseClass = [
  "px-3 xl:py-2 max-xl:py-[6px]",
  "font-semibold rounded-full",
  "disabled:opacity-20 hover:opacity-80",
  "max-xl:text-sm",
  "leading-none",
];
export const DefaultButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return (
    <AsyncButton
      {...props}
      className={classNames(props.className, buttonBaseClass, "bg-neutral-800 text-white")}
      ref={ref}
    />
  );
});
export const PrimaryButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "bg-primary")} ref={ref} />;
});
export const Layer1Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "bg-layer-1")} ref={ref} />;
});
export const Layer2Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "bg-layer-2")} ref={ref} />;
});
export const Layer3Button = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "bg-layer-3")} ref={ref} />;
});
export const WarningButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "bg-warning")} ref={ref} />;
});
export const IconButton = forwardRef<HTMLButtonElement, { iconName: string; iconSize?: number } & AsyncButtonProps>(
  ({ iconName, iconSize, ...props }: { iconName: string; iconSize?: number } & AsyncButtonProps, ref) => {
    return (
      <AsyncButton {...props} className={classNames(props.className)} ref={ref}>
        <Icon name={iconName} size={iconSize} />
      </AsyncButton>
    );
  },
);
export const BorderButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  return <AsyncButton {...props} className={classNames(props.className, buttonBaseClass, "btn-border")} ref={ref} />;
});
