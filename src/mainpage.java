

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import util.UtilDB;

/**
 * Servlet implementation class mainpage
 */
@WebServlet("/mainpage")
public class mainpage extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public mainpage() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		
		// TODO Auto-generated method stub
		String userName = request.getParameter("userName");
		String password = request.getParameter("password");
		
		Integer userID = UtilDB.loginCheck(userName, password);

		HttpSession session = request.getSession();
		session.setAttribute("userName", userName);
		session.setAttribute("password", password);
		session.setAttribute("userID", userID);
		
		PrintWriter out = response.getWriter();
		
		if (userID != -1)
		{
			out.println("<html>");
			out.println("<head>");
			out.println("<title>Main page</title>");
			out.println("</head>");
			out.println("<body>");
			out.println("<p>Login sucess</p>");
			out.println("<p>Your name-> " + userName + "</p>");
			out.println("<p>Password->" + password + "</p>");
			out.println("<p>Session ID" + session.getId() + "</p>");
			out.println("</body>");
			out.println("</html>");
		}
		else
		{
			out.println("<html>");
			out.println("<head>");
			out.println("<title>Main page</title>");
			out.println("</head>");
			out.println("<body>");
			out.println("<p>Login faile</p>");
			out.println("<p>Your name-> " + userName + "</p>");
			out.println("</body>");
			out.println("</html>");
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
