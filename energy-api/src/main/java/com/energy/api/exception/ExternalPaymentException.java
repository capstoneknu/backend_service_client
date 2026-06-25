package com.energy.api.exception;

/**
 * 외부 결제망(강원마트 Mock) 통신 장애를 표현하는 커스텀 예외.
 * 보고서 3.1.3 / Seq Diagram 3: 이 예외는 @Transactional(noRollbackFor)와 함께 사용되어,
 * 클라이언트에는 실패(400)를 알리면서도 보상 트랜잭션(환불) 원장 커밋은 롤백되지 않도록 한다.
 */
public class ExternalPaymentException extends RuntimeException {
    public ExternalPaymentException(String message) {
        super(message);
    }
}
