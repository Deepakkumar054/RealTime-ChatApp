export function formatMessageTime(date){
    return new Date(date).toLocaleDateString("en-Us",{
        hour:"2-digit",
        minute:"2-digit",
        hour12:false,
    });
}