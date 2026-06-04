package ubc.cosc322;

import java.util.ArrayList;

public class AmazonsCLI {
    public static void main(String[] args) throws InterruptedException {
        if (args.length < 2) {
            System.err.println("Usage: java AmazonsCLI <playerColor> <gameStateJson>");
            System.exit(1);
        }

        int playerColor = Integer.parseInt(args[0]); // 1 for BLACK, 2 for WHITE
        String gameStateJson = args[1];

        ArrayList<Integer> gameState = parseGameState(gameStateJson);
        AmazonAI ai = new AmazonAI(playerColor);
        int[][] board = ai.convertTo2D(gameState);

        Move bestMove = ai.getBestMove(board);

        if (bestMove != null) {
            System.out.println(String.format("{\"startX\":%d,\"startY\":%d,\"endX\":%d,\"endY\":%d,\"arrowX\":%d,\"arrowY\":%d}",
                bestMove.startX, bestMove.startY, bestMove.endX, bestMove.endY, bestMove.arrowX, bestMove.arrowY));
        } else {
            System.out.println("{\"error\":\"No valid moves available\"}");
        }
    }

    private static ArrayList<Integer> parseGameState(String json) {
        ArrayList<Integer> state = new ArrayList<>();
        String cleaned = json.replaceAll("[\\[\\]\\s]", "");
        String[] values = cleaned.split(",");
        for (String val : values) {
            state.add(Integer.parseInt(val));
        }
        return state;
    }
}
