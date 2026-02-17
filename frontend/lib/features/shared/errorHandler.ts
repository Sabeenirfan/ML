import { Alert } from 'react-native';

export enum ErrorType {
    NETWORK = 'NETWORK',
    AUTHENTICATION = 'AUTHENTICATION',
    VALIDATION = 'VALIDATION',
    SERVER = 'SERVER',
    UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
    type: ErrorType;
    message: string;
    statusCode?: number;
    originalError?: unknown;
}

export const parseError = (error: unknown, context?: string): ErrorInfo => {
    console.error(`[${context || 'Error'}]`, error);

    let type = ErrorType.UNKNOWN;
    let message = 'Something went wrong';
    let statusCode: number | undefined;

    const err = error as { message?: string; code?: string; response?: { status: number; data?: { message?: string } } };

    if (err.message === 'Network Error' || err.code === 'ECONNREFUSED') {
        type = ErrorType.NETWORK;
        message = 'No internet connection. Please check your network and try again.';
    } else if (err.response) {
        statusCode = err.response.status;

        switch (err.response.status) {
            case 400:
                type = ErrorType.VALIDATION;
                message = err.response.data?.message || 'Invalid request. Please check your input.';
                break;
            case 401:
                type = ErrorType.AUTHENTICATION;
                message = 'Your session has expired. Please login again.';
                break;
            case 403:
                type = ErrorType.AUTHENTICATION;
                message = 'You do not have permission to perform this action.';
                break;
            case 404:
                type = ErrorType.SERVER;
                message = err.response.data?.message || 'The requested resource was not found.';
                break;
            case 422:
                type = ErrorType.VALIDATION;
                message = err.response.data?.message || 'Validation failed. Please check your input.';
                break;
            case 500:
            case 502:
            case 503:
                type = ErrorType.SERVER;
                message = 'Server error. Please try again later.';
                break;
            default:
                type = ErrorType.SERVER;
                message = err.response.data?.message || 'An error occurred. Please try again.';
        }
    } else if (err.code === 'ECONNABORTED') {
        type = ErrorType.NETWORK;
        message = 'Request timeout. Please try again.';
    } else if (err.message) {
        message = err.message;
    }

    return { type, message, statusCode, originalError: error };
};

export const handleError = (error: unknown, context?: string): ErrorInfo => {
    const errorInfo = parseError(error, context);
    Alert.alert(getErrorTitle(errorInfo.type), errorInfo.message, [{ text: 'OK', style: 'default' }]);
    return errorInfo;
};

export const handleErrorWithCallback = (
    error: unknown,
    context: string | undefined,
    callback: (errorInfo: ErrorInfo) => void
): ErrorInfo => {
    const errorInfo = parseError(error, context);
    callback(errorInfo);
    return errorInfo;
};

const getErrorTitle = (type: ErrorType): string => {
    switch (type) {
        case ErrorType.NETWORK: return 'Connection Error';
        case ErrorType.AUTHENTICATION: return 'Authentication Error';
        case ErrorType.VALIDATION: return 'Validation Error';
        case ErrorType.SERVER: return 'Server Error';
        default: return 'Error';
    }
};

export const showSuccess = (message: string, title = 'Success') => {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showWarning = (message: string, title = 'Warning') => {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const showConfirmation = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title = 'Confirm'
) => {
    Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', style: 'default', onPress: onConfirm },
    ]);
};

export const safeExecute = async <T>(
    operation: () => Promise<T>,
    context: string,
    options?: { onError?: (errorInfo: ErrorInfo) => void; showAlert?: boolean }
): Promise<T | null> => {
    try {
        return await operation();
    } catch (error) {
        const errorInfo = parseError(error, context);
        if (options?.showAlert !== false) {
            Alert.alert(getErrorTitle(errorInfo.type), errorInfo.message);
        }
        if (options?.onError) options.onError(errorInfo);
        return null;
    }
};
