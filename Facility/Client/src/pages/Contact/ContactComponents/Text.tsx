import { type } from "@testing-library/user-event/dist/type";
import React, { useRef } from "react";

//////////////doestn check for valid "as"s
// export const Text = ({as, children}: {as?:any, children: React.ReactNode}) => {
//     const Component = as || "span";
//     return <Component>{ children } </Component>  
// }

//----------------------------------------------------------------------------------------------
///////////////checks for valid "as"s
//***** "1. "as" cannot receive invalid HTML elemnt strings */
//C is generic in here. (C for Component) and it extends 
//from React.ElementTYpe which includes every valid element in React. 
//SO we don't need to write them one by one
// export const Text = <C extends React.ElementType>({
//     as, children
// }: {
//         as?: C,
//     children:React.ReactNode
// }) => {
//     const Component = as || "span";

//     return <Component>{children}</Component>
// }

//----------------------------------------------------------------------------------------------
// //support attributes and wrong attributes should be pased for a valid element
// type TextProps <C extends React.ElementType> = {
//     as?: C,
//     children: React.ReactNode
// } & React.ComponentPropsWithoutRef<C>

// export const Text = <C extends React.ElementType>({
//     as,
//     children,
//     ...restProps
// }: TextProps<C>) => {
//     const Component = as || "span";

//     return <Component {...restProps}>{children}</Component>
// }

//----------------------------------------------------------------------------------------------
//ensure the type safety for the default generic case 
//(if there is no default span defined for C generic type and we dont want to
//put as prop in Text we cannot check if a propery exist or valid
//so we need to add default span (or what we want to make as default element))
{/* <Text href="asdad" asd="asd" merv="merv">a text without an as prop</Text> */ }
// type TextProps<C extends React.ElementType> = {
//     as?: C,
//     children: React.ReactNode
// } & React.ComponentPropsWithoutRef<C>

// export const Text = <C extends React.ElementType = "span">({
//     as,
//     children,
//     ...restProps
// }: TextProps<C>) => {
//     const Component = as || "span";

//     return <Component {...restProps}>{children}</Component>
// }

//----------------------------------------------------------------------------------------------
//our polymorphic component can render a custom component cause our children extends from React Elemt type
//which is includes fuction and also class components 
{/* <Text as={Emphasis}>le vide est ton nouveau prenom</Text> */ }

//----------------------------------------------------------------------------------------------
//building a robust polymorphic component with its own props  (for that we need the know union type, keyof, omit)
//we define a custom color prop buuuut React.ComponentPropsWithoutRef has its own color prop
//so we need to omit React.ComponentPropsWithoutRef (otherwise it overreads the color) 

// type Rainbow =
//     "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet"

// // type TextProps<C extends React.ElementType> = {
// //     as?: C;
// //     color?: Rainbow | "black";
// //     children: React.ReactNode
// // } & Omit<React.ComponentPropsWithoutRef<C>,"color">; refactooooooring is everywhere :)

// type TextProps<C extends React.ElementType> = { // just contains the props for our components
//     as?: C;
//     color?: Rainbow | "black";
//     // children: React.ReactNode // use React.PropsWİthChildrenInstead
// }
// // type Props<C extends React.ElementType> = TextProps<C> &
// type Props<C extends React.ElementType> = React.PropsWithChildren<TextProps<C>> & //take the props and add the children of it
//     // Omit<React.ComponentPropsWithoutRef<C>, "color">; 
//     Omit<React.ComponentPropsWithoutRef<C>,keyof TextProps<C>>; 


// export const Text = <C extends React.ElementType = "span">({
//     as,
//     children,
//     ...restProps
// // }: TextProps<C>) => {
//     }: Props<C>) => {
//     const Component = as || "span";

//     return <Component {...restProps}>{children}</Component>
// }



//----------------------------------------------------------------------------------------------
//passing in our custom props to the polymorphic component
// type Rainbow =
//     "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet"

// type TextProps<C extends React.ElementType> = { // just contains the props for our components
//     as?: C;
//     color?: Rainbow | "black";

// };

// type Props<C extends React.ElementType> = React.PropsWithChildren<TextProps<C>> & //take the props and add the children of it
//     Omit<React.ComponentPropsWithoutRef<C>, keyof TextProps<C>>;

// export const Text = <C extends React.ElementType = "span">({
//     as,
//     children,
//     color,
//     style,
//     ...restProps
// }: Props<C>) => {
//     const Component = as || "span";

//     const internalStyles = color ? { style: {...style, color } } : {};

//     return <Component {...restProps} {...internalStyles}>{children}</Component>
// }

// //----------------------------------------------------------------------------------------------
// //implementing the reusable utility
// type Rainbow =
//     "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet"


// type AsProp<C extends React.ElementType> = {
//     as?: C;

// }

// // type TextProps<C extends React.ElementType> = AsProp<C> &// just contains the props for our components
// // {
// //     // as?: C;
// //     color?: Rainbow | "black"; //a spesific color prop for Text component

// // };

// type TextProps =
// {
//     color?: Rainbow | "black"; 

// };

// // type Props<C extends React.ElementType> = React.PropsWithChildren<TextProps<C>> & //take the props and add the children of it
// //     Omit<React.ComponentPropsWithoutRef<C>, keyof TextProps<C>>;

// type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P)
// type PropsWithAs<C extends React.ElementType, Props>=Props & AsProp<C>
// type PolymorphicComponentProps<
//     C extends React.ElementType,
//     Props = {}// props that spesific to the component
//     > =
//     // React.PropsWithChildren<Props & AsProp<C>> & Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;
//     React.PropsWithChildren<PropsWithAs<C, Props>> & Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;//?



// export const Text = <C extends React.ElementType = "span">({
//     as,
//     children,
//     color,
//     style,
//     ...restProps
// }: PolymorphicComponentProps<C, TextProps>) => {
//     const Component = as || "span";

//     const internalStyles = color ? { style: { ...style, color } } : {};

//     return <Component {...restProps} {...internalStyles}>{children}</Component>

// }

//----------------------------------------------------------------------------------------------
//adding the ref type
type Rainbow =
    "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet"


type AsProp<C extends React.ElementType> = {
    as?: C;
}

type TextProps = // just contains the props for our components
    {
        color?: Rainbow | "black";

    };

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P)

type PropsWithAs<C extends React.ElementType, Props> = Props & AsProp<C>

type PolymorphicComponentProps<
    C extends React.ElementType,
    Props = {}// props that spesific to the component
    > =
    React.PropsWithChildren<PropsWithAs<C, Props>> & Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;//?

type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>["ref"] //pick out the ref from components with ref

type Props<C extends React.ElementType, P> = PolymorphicComponentProps<C, P>

type PolymorphicComponentPropsWithRef<C extends React.ElementType, P>
    = PolymorphicComponentProps<C, P> &
    {
        ref?: PolymorphicRef<C>;
    }

type TextComponent = <C extends React.ElementType>
    (props: PolymorphicComponentPropsWithRef<C, TextProps>)
    => React.ReactElement | null;
export const Text: TextComponent = React.forwardRef(<C extends React.ElementType = "span">({
    as,
    children,
    color,
    style,
    ...restProps
}:
    // PolymorphicComponentProps<C, TextProps>,
    Props<C, TextProps>,//---------------------
    ref?: PolymorphicRef<C>
) => {
    const Component = as || "span";

    const internalStyles = color ? { style: { ...style, color } } : {};

    return <Component {...restProps} {...internalStyles} ref={ref}>{children} </Component>

})